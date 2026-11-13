package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.model.IncidenteSoporte;
import cr.or.guiasyscouts.reservas.repository.AuditoriaRepository;
import cr.or.guiasyscouts.reservas.repository.IncidenteSoporteRepository;
import cr.or.guiasyscouts.reservas.service.DiagnosticoService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DiagnosticoHttpIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private IncidenteSoporteRepository incidentes;
    @Autowired private AuditoriaRepository auditoria;
    @Autowired private DiagnosticoService diagnostico;

    @AfterEach
    void limpiarRegistrosCreados() {
        incidentes.deleteAll();
        auditoria.deleteAll();
    }

    @Test
    void diagnosticoSoloPermiteAccesoAdministrativoYNoExponeConfiguracion() throws Exception {
        mockMvc.perform(get("/api/v1/admin/diagnostico"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/diagnostico").with(user("persona@example.test").roles("USUARIO")))
                .andExpect(status().isForbidden());

        String response = mockMvc.perform(get("/api/v1/admin/diagnostico")
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidentesAbiertos").value(0))
                .andExpect(jsonPath("$.verificaciones").isArray())
                .andExpect(jsonPath("$.verificaciones[?(@.codigo == 'base-datos')]").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        mockMvc.perform(get("/api/v1/admin/diagnostico/no-existe")
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/admin/diagnostico")
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isMethodNotAllowed());

        assertThat(response).doesNotContain("secretKey", "apiKey", "password", "jdbc:mysql");
        assertThat(incidentes.countByEstado("ABIERTO")).isZero();
    }

    @Test
    void registraErroresSinGuardarMensajesCrudosYPermiteResolverConBitacora() throws Exception {
        String correlationId = diagnostico.registrarErrorApi("GET",
                new IllegalStateException("dato sensible que no debe persistirse"));
        String correlationIdRepetido = diagnostico.registrarErrorApi("GET",
                new IllegalStateException("segundo dato sensible que tampoco debe persistirse"));

        IncidenteSoporte incident = incidentes.findAll().get(0);
        assertThat(incident.getCorrelationId()).isEqualTo(correlationIdRepetido);
        assertThat(incident.getTipoTecnico()).isEqualTo("IllegalStateException");
        assertThat(incident.getOcurrencias()).isEqualTo(2);
        assertThat(incident.getId()).isNotNull();
        assertThat(correlationId).isNotEqualTo(correlationIdRepetido);
        assertThat(incident.getResumen()).doesNotContain("dato sensible");
        assertThat(incident.getRecomendacion()).doesNotContain("dato sensible");

        mockMvc.perform(get("/api/v1/admin/diagnostico")
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incidentesAbiertos").value(1))
                .andExpect(jsonPath("$.incidentes[0].correlationId").value(correlationIdRepetido))
                .andExpect(jsonPath("$.incidentes[0].estado").value("ABIERTO"));

        mockMvc.perform(patch("/api/v1/admin/diagnostico/incidentes/{id}/resolver", incident.getId())
                        .with(user("admin@example.test").roles("ADMIN")))
                .andExpect(status().isOk());

        IncidenteSoporte resolved = incidentes.findById(incident.getId()).orElseThrow();
        assertThat(resolved.getEstado()).isEqualTo("RESUELTO");
        assertThat(resolved.getResueltaPor()).isEqualTo("admin@example.test");
        assertThat(auditoria.findAll()).anySatisfy(entry -> {
            assertThat(entry.getAccion()).isEqualTo("RESOLVER_INCIDENTE");
            assertThat(entry.getActor()).isEqualTo("admin@example.test");
        });
    }
}
