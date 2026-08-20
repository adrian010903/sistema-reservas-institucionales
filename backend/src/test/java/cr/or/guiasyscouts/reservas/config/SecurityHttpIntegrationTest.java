package cr.or.guiasyscouts.reservas.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
}
