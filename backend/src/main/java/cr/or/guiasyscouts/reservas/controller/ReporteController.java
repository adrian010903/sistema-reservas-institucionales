package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Reserva;
import cr.or.guiasyscouts.reservas.dto.ReporteResumenResponse;
import cr.or.guiasyscouts.reservas.service.ReporteAnaliticoService;
import cr.or.guiasyscouts.reservas.service.ReportePdfVisualService;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/reportes")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
@Transactional(readOnly = true)
public class ReporteController {
    private final ReportePdfVisualService reportePdfService;
    private final ReporteAnaliticoService reporteAnaliticoService;
    public ReporteController(ReportePdfVisualService reportePdfService, ReporteAnaliticoService reporteAnaliticoService) {
        this.reportePdfService = reportePdfService;
        this.reporteAnaliticoService = reporteAnaliticoService;
    }

    @GetMapping("/resumen")
    public ReporteResumenResponse resumen(@RequestParam(required = false) LocalDate desde,
                                          @RequestParam(required = false) LocalDate hasta,
                                          @RequestParam(required = false) EstadoReserva estado,
                                          @RequestParam(required = false) Long lugarId,
                                          @RequestParam(required = false) Long espacioId) {
        return reporteAnaliticoService.resumen(desde, hasta, estado, lugarId, espacioId);
    }

    @GetMapping(value = "/reservas.csv", produces = "text/csv")
    public ResponseEntity<byte[]> reservasCsv(@RequestParam(required = false) LocalDate desde,
                                               @RequestParam(required = false) LocalDate hasta,
                                               @RequestParam(required = false) EstadoReserva estado,
                                               @RequestParam(required = false) Long lugarId,
                                               @RequestParam(required = false) Long espacioId,
                                               @RequestParam(required = false) String secciones) {
        List<Reserva> reservas = reporteAnaliticoService.filtrar(desde, hasta, estado, lugarId, espacioId);
        ReporteResumenResponse resumen = reporteAnaliticoService.resumen(desde, hasta, estado, lugarId, espacioId);
        Set<String> seleccion = secciones == null ? Set.of("lugares", "espacios", "detalles", "estados")
                : new HashSet<>(Arrays.asList(secciones.split(",")));
        StringBuilder csv = new StringBuilder("REPORTE DE RESERVAS INSTITUCIONALES\r\n")
                .append("Periodo,").append(resumen.desde()).append(',').append(resumen.hasta()).append("\r\n")
                .append("Reservas,").append(resumen.total()).append("\r\n")
                .append("Horas reservadas,").append(resumen.totalHoras()).append("\r\n")
                .append("Ocupacion estimada,").append(resumen.porcentajeOcupacion()).append("%\r\n")
                .append("Personas atendidas,").append(resumen.totalPersonas()).append("\r\n")
                .append("Promedio de personas por reserva,").append(resumen.promedioPersonasPorReserva()).append("\r\n")
                .append("Porcentaje de cancelacion,").append(resumen.porcentajeCancelacion()).append("%\r\n")
                .append("Variacion de reservas,").append(resumen.tienePeriodoAnterior() ? resumen.variacionReservas() + "%" : "Sin datos anteriores para comparar").append("\r\n")
                .append("Variacion de horas,").append(resumen.tienePeriodoAnterior() ? resumen.variacionHoras() + "%" : "Sin datos anteriores para comparar").append("\r\n")
                .append("Hay datos del periodo anterior,").append(resumen.tienePeriodoAnterior() ? "Si" : "No").append("\r\n\r\n")
                .append("USO POR DIA\r\nDia,Horas\r\n");
        resumen.porDiaSemana().forEach((dia, horas) -> csv.append(dia).append(',').append(horas).append("\r\n"));
        csv.append("\r\nRESERVAS POR HORA DE INICIO\r\nHora,Reservas\r\n");
        resumen.porHoraInicio().forEach((hora, cantidad) -> csv.append(hora).append(',').append(cantidad).append("\r\n"));
        csv.append("\r\n");
        if (seleccion.contains("espacios")) {
            csv.append("ESPACIOS\r\nEspacio,Lugar,Reservas,Horas,Ocupacion,Nivel\r\n");
            resumen.espaciosUso().forEach(e -> csv.append(celda(e.nombre())).append(',').append(celda(e.lugar())).append(',')
                    .append(e.reservas()).append(',').append(e.horas()).append(',').append(e.porcentajeOcupacion()).append("%,").append(e.nivelUso()).append("\r\n"));
            csv.append("\r\n");
        }
        if (seleccion.contains("lugares")) {
            csv.append("LUGARES\r\nLugar,Reservas,Horas,Ocupacion,Nivel\r\n");
            resumen.lugaresUso().forEach(l -> csv.append(celda(l.nombre())).append(',').append(l.reservas()).append(',')
                    .append(l.horas()).append(',').append(l.porcentajeOcupacion()).append("%,").append(l.nivelUso()).append("\r\n"));
            csv.append("\r\n");
        }
        if (seleccion.contains("estados")) {
            csv.append("ESTADOS\r\nEstado,Reservas\r\n");
            resumen.porEstado().forEach((nombre, cantidad) -> csv.append(nombre).append(',').append(cantidad).append("\r\n"));
            csv.append("\r\n");
        }
        if (seleccion.contains("detalles")) {
            csv.append("DETALLE DE RESERVAS\r\nID,Fecha,Hora inicio,Hora fin,Estado,Personas,Lugar,Espacio,Usuario\r\n");
            reservas.forEach(r -> csv.append(r.getId()).append(',').append(r.getFecha()).append(',').append(r.getHoraInicio()).append(',')
                    .append(r.getHoraFin()).append(',').append(r.getEstado()).append(',').append(r.getCantidadPersonas()).append(',')
                    .append(celda(r.getEspacio().getLugar() == null ? "Sin lugar" : r.getEspacio().getLugar().getNombre())).append(',')
                    .append(celda(r.getEspacio().getNombre())).append(',')
                    .append(celda(r.getUsuario() == null ? "Sin usuario" : r.getUsuario().getCorreo())).append("\r\n"));
        }
        byte[] contenido = ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reservas-" + LocalDate.now() + ".csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(contenido);
    }

    @GetMapping(value = "/reservas.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> reservasPdf(@RequestParam(required = false) LocalDate desde,
                                               @RequestParam(required = false) LocalDate hasta,
                                               @RequestParam(required = false) EstadoReserva estado,
                                               @RequestParam(required = false) Long lugarId,
                                               @RequestParam(required = false) Long espacioId,
                                               @RequestParam(required = false) String secciones) {
        ReporteResumenResponse resumen = reporteAnaliticoService.resumen(desde, hasta, estado, lugarId, espacioId);
        byte[] contenido = reportePdfService.generar(reporteAnaliticoService.filtrar(desde, hasta, estado, lugarId, espacioId), desde, hasta,
                estado == null ? null : estado.name(), secciones, resumen);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reporte-reservas-" + LocalDate.now() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF).body(contenido);
    }

    private String celda(String value) { return "\"" + String.valueOf(value).replace("\"", "\"\"") + "\""; }
}
