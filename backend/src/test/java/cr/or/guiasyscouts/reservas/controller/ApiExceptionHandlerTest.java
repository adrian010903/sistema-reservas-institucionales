package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.service.DiagnosticoService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ApiExceptionHandlerTest {
    @Test
    void respuestaInternaUsaReferenciaSeguraSinRetornarMensajeOriginalNiRutaCompleta() {
        DiagnosticoService diagnostics = mock(DiagnosticoService.class);
        when(diagnostics.registrarErrorApi(org.mockito.ArgumentMatchers.eq("GET"),
                org.mockito.ArgumentMatchers.any(Exception.class))).thenReturn("correlation-id-de-prueba");
        ApiExceptionHandler handler = new ApiExceptionHandler(diagnostics);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/reset/token-privado");

        ProblemDetail response = handler.errorNoControlado(
                new IllegalStateException("mensaje técnico privado"), request);

        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getDetail()).contains("correlation-id-de-prueba").doesNotContain("mensaje técnico privado");
        assertThat(response.getInstance().toString()).isEqualTo("/api/v1");
        assertThat(response.getProperties()).containsEntry("correlationId", "correlation-id-de-prueba");
    }

    @Test
    void devuelveReferenciaAunqueLaBaseNoPermitaGuardarElIncidente() {
        DiagnosticoService diagnostics = mock(DiagnosticoService.class);
        when(diagnostics.registrarErrorApi(org.mockito.ArgumentMatchers.eq("POST"),
                org.mockito.ArgumentMatchers.any(Exception.class))).thenThrow(new IllegalStateException("db offline"));
        ApiExceptionHandler handler = new ApiExceptionHandler(diagnostics);
        HttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/reservas");

        ProblemDetail response = handler.errorNoControlado(new RuntimeException("fallo"), request);

        assertThat(response.getStatus()).isEqualTo(500);
        assertThat(response.getProperties()).containsKey("correlationId");
        assertThat(response.getInstance().toString()).isEqualTo("/api/v1");
    }

    @Test
    void unAccesoDenegadoSigueSiendo403YNoSeRegistraComoFallaDelServidor() {
        DiagnosticoService diagnostics = mock(DiagnosticoService.class);
        ApiExceptionHandler handler = new ApiExceptionHandler(diagnostics);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/diagnostico");

        ProblemDetail response = handler.accesoDenegado(new AccessDeniedException("rol insuficiente"), request);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getDetail()).isEqualTo("No tienes permisos para realizar esta operación");
        verifyNoInteractions(diagnostics);
    }
}
