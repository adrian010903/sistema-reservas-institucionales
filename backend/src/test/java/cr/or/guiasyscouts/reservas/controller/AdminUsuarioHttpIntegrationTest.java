package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.model.EstadoUsuario;
import cr.or.guiasyscouts.reservas.model.RolUsuario;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@SpringBootTest
@AutoConfigureMockMvc
class AdminUsuarioHttpIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void administradorCreaUsuarioNormalizadoQuePuedeIniciarSesion() throws Exception {
        String adminCorreo = "admin-" + UUID.randomUUID() + "@example.com";
        crearUsuarioPersistido(adminCorreo, RolUsuario.ADMIN);
        String correoNuevo = "Persona-" + UUID.randomUUID() + "@Example.com";
        String correoNormalizado = correoNuevo.toLowerCase();
        String password = "ClaveSegura123";

        mockMvc.perform(post("/api/v1/admin/usuarios")
                        .with(user(adminCorreo).roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"  Persona nueva  ","correo":"%s","password":"%s",
                                 "rol":"USUARIO","estado":"ACTIVO"}
                                """.formatted(correoNuevo, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Persona nueva"))
                .andExpect(jsonPath("$.correo").value(correoNormalizado))
                .andExpect(jsonPath("$.rol").value("USUARIO"))
                .andExpect(jsonPath("$.estado").value("ACTIVO"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"%s","password":"%s"}
                                """.formatted(correoNormalizado, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void administradorPuedeDesactivarUsuarioYElAccesoQuedaBloqueado() throws Exception {
        String adminCorreo = "admin-" + UUID.randomUUID() + "@example.com";
        crearUsuarioPersistido(adminCorreo, RolUsuario.ADMIN);
        String objetivoCorreo = "usuario-" + UUID.randomUUID() + "@example.com";
        Usuario objetivo = crearUsuarioPersistido(objetivoCorreo, RolUsuario.USUARIO);

        mockMvc.perform(patch("/api/v1/admin/usuarios/{id}", objetivo.getId())
                        .with(user(adminCorreo).roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"estado":"INACTIVO","rol":"USUARIO"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("INACTIVO"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"%s","password":"ClaveSegura123"}
                                """.formatted(objetivoCorreo)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("El usuario se encuentra bloqueado o inactivo"));
    }

    @Test
    void administradorPuedeEliminarUsuarioComunPeroNoSuCuentaNiOtraCuentaAdministrativa() throws Exception {
        String adminCorreo = "admin-" + UUID.randomUUID() + "@example.com";
        Usuario admin = crearUsuarioPersistido(adminCorreo, RolUsuario.ADMIN);
        Usuario objetivo = crearUsuarioPersistido("usuario-" + UUID.randomUUID() + "@example.com", RolUsuario.USUARIO);
        Usuario otroAdmin = crearUsuarioPersistido("otro-admin-" + UUID.randomUUID() + "@example.com", RolUsuario.ADMIN);

        mockMvc.perform(delete("/api/v1/admin/usuarios/{id}", objetivo.getId())
                        .with(user(adminCorreo).roles("ADMIN")))
                .andExpect(status().isOk());
        org.assertj.core.api.Assertions.assertThat(usuarios.existsById(objetivo.getId())).isFalse();

        mockMvc.perform(delete("/api/v1/admin/usuarios/{id}", admin.getId())
                        .with(user(adminCorreo).roles("ADMIN")))
                .andExpect(status().isConflict());
        org.assertj.core.api.Assertions.assertThat(usuarios.existsById(admin.getId())).isTrue();

        mockMvc.perform(delete("/api/v1/admin/usuarios/{id}", otroAdmin.getId())
                        .with(user(adminCorreo).roles("ADMIN")))
                .andExpect(status().isForbidden());
        org.assertj.core.api.Assertions.assertThat(usuarios.existsById(otroAdmin.getId())).isTrue();
    }

    private Usuario crearUsuarioPersistido(String correo, RolUsuario rol) {
        Usuario usuario = new Usuario();
        usuario.setNombre("Usuario de integración");
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode("ClaveSegura123"));
        usuario.setEstado(EstadoUsuario.ACTIVO);
        usuario.setRol(rol);
        return usuarios.save(usuario);
    }
}
