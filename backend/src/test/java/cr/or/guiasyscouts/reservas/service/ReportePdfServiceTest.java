package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class ReportePdfServiceTest {
    private final ReportePdfService service = new ReportePdfService();

    @Test
    void generaDocumentoPdfValidoAunqueNoHayaResultados() {
        byte[] contenido = service.generar(Collections.emptyList(), null, null, null);

        String pdf = new String(contenido, StandardCharsets.ISO_8859_1);
        assertTrue(pdf.startsWith("%PDF-1.4"));
        assertTrue(pdf.contains("/Count 1"));
        assertTrue(pdf.endsWith("%%EOF"));
    }

    @Test
    void paginaAutomaticamenteUnListadoLargo() {
        Reserva reserva = reserva();
        byte[] contenido = service.generar(Collections.nCopies(30, reserva),
                LocalDate.now(), LocalDate.now().plusMonths(1), EstadoReserva.PENDIENTE.name());

        String pdf = new String(contenido, StandardCharsets.ISO_8859_1);
        assertTrue(pdf.contains("/Count 2"));
        assertTrue(pdf.contains("Reporte de reservas institucionales"));
        assertTrue(pdf.length() > 1500);
    }

    private Reserva reserva() {
        Usuario usuario = new Usuario(); usuario.setCorreo("persona@ejemplo.cr");
        Espacio espacio = new Espacio(); espacio.setNombre("Sala de reuniones");
        Reserva reserva = new Reserva(); reserva.setUsuario(usuario); reserva.setEspacio(espacio);
        reserva.setFecha(LocalDate.now().plusDays(1)); reserva.setHoraInicio(LocalTime.of(9, 0));
        reserva.setHoraFin(LocalTime.of(10, 0)); reserva.setCantidadPersonas(12);
        ReflectionTestUtils.setField(reserva, "id", 15L);
        return reserva;
    }
}
