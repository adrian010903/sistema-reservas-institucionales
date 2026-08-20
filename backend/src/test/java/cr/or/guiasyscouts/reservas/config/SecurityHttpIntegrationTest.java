package cr.or.guiasyscouts.reservas.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.jayway.jsonpath.JsonPath;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityHttpIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void estadoEsPublico() throws Exception {
        mockMvc.perform(get("/api/v1/status"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.estado").value("activo"))
                .andExpect(jsonPath("$.organizacion").value("Guias y Scouts de Costa Rica"));
    }

    @Test
    void configuracionEsPublicaYUsaColones() throws Exception {
        mockMvc.perform(get("/api/v1/configuracion-publica"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moneda").value("CRC"))
                .andExpect(jsonPath("$.horaApertura").value("08:00"))
                .andExpect(jsonPath("$.horaCierre").value("17:00"));
    }

    @Test
    void recursoProtegidoSinTokenDevuelveProblemDetails() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("No autenticado"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.instance").value("/api/v1/usuarios/me"));
    }

    @Test
    void usuarioComunNoPuedeAccederAlPanelAdministrativo() throws Exception {
        mockMvc.perform(get("/api/v1/admin/reservas")
                        .with(user("usuario@example.com").roles("USUARIO")))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Acceso denegado"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void registroLoginYPerfilFuncionanConJwtReal() throws Exception {
        String correo = "integracion-" + UUID.randomUUID() + "@example.com";
        String password = "ClaveSegura123";
        String registro = """
                {"nombre":"Usuario Integración","correo":"%s","password":"%s"}
                """.formatted(correo, password);

        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correo").value(correo))
                .andExpect(jsonPath("$.rol").value("USUARIO"))
                .andExpect(jsonPath("$.estado").value("ACTIVO"));

        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Conflicto"))
                .andExpect(jsonPath("$.detail").value("El correo ya esta registrado"));

        String login = """
                {"correo":"%s","password":"%s"}
                """.formatted(correo, password);
        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String token = JsonPath.read(respuesta, "$.token");

        mockMvc.perform(get("/api/v1/usuarios/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value(correo))
                .andExpect(jsonPath("$.nombre").value("Usuario Integración"));
    }

    @Test
    void credencialesIncorrectasDevuelven401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"nadie@example.com\",\"password\":\"Incorrecta123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Credenciales invalidas"));
    }

    @Test
    void registroInvalidoExponeErroresPorCampo() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"\",\"correo\":\"correo-invalido\",\"password\":\"corta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Datos inválidos"))
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.correo").exists())
                .andExpect(jsonPath("$.errores.password").exists());
    }
}
