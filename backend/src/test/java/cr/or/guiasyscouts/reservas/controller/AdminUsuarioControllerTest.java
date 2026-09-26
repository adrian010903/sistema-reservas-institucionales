package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.AdminUsuarioUpdateRequest;
import cr.or.guiasyscouts.reservas.dto.AdminUsuarioCreateRequest;
import cr.or.guiasyscouts.reservas.model.*;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AdminUsuarioControllerTest {
    private final UsuarioRepository repository = mock(UsuarioRepository.class);
    private final AuditoriaService auditoria = mock(AuditoriaService.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final AdminUsuarioController controller = new AdminUsuarioController(repository, auditoria, passwordEncoder);

    @Test
    void administradorPuedeCrearUsuarioComun() {
        Usuario actor = usuario(1L, "admin@ejemplo.cr", RolUsuario.ADMIN);
        when(repository.findByCorreoIgnoreCase(actor.getCorreo())).thenReturn(Optional.of(actor));
        when(repository.existsByCorreoIgnoreCase("persona@ejemplo.cr")).thenReturn(false);
        when(passwordEncoder.encode("Clave123")).thenReturn("hash");
        when(repository.save(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario guardado = invocation.getArgument(0);
            ReflectionTestUtils.setField(guardado, "id", 2L);
            return guardado;
        });

        var response = controller.crear(autenticacion(actor), new AdminUsuarioCreateRequest(
                "Persona", "Persona@Ejemplo.cr", "Clave123", RolUsuario.USUARIO, EstadoUsuario.ACTIVO));

        assertEquals("persona@ejemplo.cr", response.correo());
        assertEquals(RolUsuario.USUARIO.name(), response.rol());
        verify(auditoria).registrar(actor.getCorreo(), "CREAR", "USUARIO", 2L,
                "Rol=USUARIO, estado=ACTIVO");
    }

    @Test
    void administradorNoPuedeCrearOtraCuentaAdministrativa() {
        Usuario actor = usuario(1L, "admin@ejemplo.cr", RolUsuario.ADMIN);
        when(repository.findByCorreoIgnoreCase(actor.getCorreo())).thenReturn(Optional.of(actor));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.crear(
                autenticacion(actor), new AdminUsuarioCreateRequest("Otro admin", "otro@ejemplo.cr",
                        "Clave123", RolUsuario.ADMIN, EstadoUsuario.ACTIVO)));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void administradorNoPuedePromoverOtrosAdministradores() {
        Usuario actor = usuario(1L, "admin@ejemplo.cr", RolUsuario.ADMIN);
        Usuario objetivo = usuario(2L, "persona@ejemplo.cr", RolUsuario.USUARIO);
        preparar(actor, objetivo);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.actualizar(
                autenticacion(actor), objetivo.getId(), new AdminUsuarioUpdateRequest(EstadoUsuario.ACTIVO, RolUsuario.ADMIN)));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    void administradorNoPuedeBloquearOtraCuentaAdministrativa() {
        Usuario actor = usuario(1L, "admin1@ejemplo.cr", RolUsuario.ADMIN);
        Usuario objetivo = usuario(2L, "admin2@ejemplo.cr", RolUsuario.ADMIN);
        preparar(actor, objetivo);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.actualizar(
                autenticacion(actor), objetivo.getId(), new AdminUsuarioUpdateRequest(EstadoUsuario.BLOQUEADO, RolUsuario.ADMIN)));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void superadministradorPuedePromoverUsuario() {
        Usuario actor = usuario(1L, "super@ejemplo.cr", RolUsuario.SUPERADMIN);
        Usuario objetivo = usuario(2L, "persona@ejemplo.cr", RolUsuario.USUARIO);
        preparar(actor, objetivo);
        when(repository.save(objetivo)).thenReturn(objetivo);

        var response = controller.actualizar(autenticacion(actor), objetivo.getId(),
                new AdminUsuarioUpdateRequest(EstadoUsuario.ACTIVO, RolUsuario.ADMIN));

        assertEquals(RolUsuario.ADMIN.name(), response.rol());
        verify(auditoria).registrar(actor.getCorreo(), "ACTUALIZAR", "USUARIO", objetivo.getId(),
                "Rol=ADMIN, estado=ACTIVO");
    }

    @Test
    void nadiePuedeCambiarSuPropioRolOEstado() {
        Usuario actor = usuario(1L, "super@ejemplo.cr", RolUsuario.SUPERADMIN);
        preparar(actor, actor);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> controller.actualizar(
                autenticacion(actor), actor.getId(), new AdminUsuarioUpdateRequest(EstadoUsuario.ACTIVO, RolUsuario.ADMIN)));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    private void preparar(Usuario actor, Usuario objetivo) {
        when(repository.findByCorreoIgnoreCase(actor.getCorreo())).thenReturn(Optional.of(actor));
        when(repository.findById(objetivo.getId())).thenReturn(Optional.of(objetivo));
    }

    private Authentication autenticacion(Usuario actor) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(actor.getCorreo());
        return authentication;
    }

    private Usuario usuario(Long id, String correo, RolUsuario rol) {
        Usuario usuario = new Usuario(); usuario.setNombre(correo); usuario.setCorreo(correo);
        usuario.setRol(rol); usuario.setEstado(EstadoUsuario.ACTIVO);
        ReflectionTestUtils.setField(usuario, "id", id); return usuario;
    }
}
