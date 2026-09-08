package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Reserva;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import cr.or.guiasyscouts.reservas.service.ReportePdfVisualService;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/reportes")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
@Transactional(readOnly = true)
public class ReporteController {
    private final ReservaRepository reservaRepository;
    private final ReportePdfVisualService reportePdfService;
    public ReporteController(ReservaRepository reservaRepository, ReportePdfVisualService reportePdfService) {
        this.reservaRepository = reservaRepository; this.reportePdfService = reportePdfService;
    }

    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        List<Reserva> reservas = reservaRepository.findAll();
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoReserva estado : EstadoReserva.values()) porEstado.put(estado.name(), reservas.stream().filter(r -> r.getEstado() == estado).count());
        Map<String, Long> porEspacio = reservas.stream().filter(r -> r.getEspacio() != null)
                .collect(java.util.stream.Collectors.groupingBy(r -> r.getEspacio().getNombre(), java.util.stream.Collectors.counting()));
        Map<String, Long> porLugar = reservas.stream().filter(r -> r.getEspacio() != null)
                .collect(java.util.stream.Collectors.groupingBy(r -> r.getEspacio().getLugar() == null ? "Sin lugar" : r.getEspacio().getLugar().getNombre(), java.util.stream.Collectors.counting()));
        Map<String, Long> porMes = reservas.stream().filter(r -> r.getFecha() != null)
                .collect(java.util.stream.Collectors.groupingBy(r -> Month.of(r.getFecha().getMonthValue()).name(), java.util.stream.Collectors.counting()));
        LocalDate inicioSemana = LocalDate.now().minusDays(6);
        Map<String, Long> porEspacioSemana = reservas.stream().filter(r -> r.getFecha() != null && !r.getFecha().isBefore(inicioSemana))
                .collect(java.util.stream.Collectors.groupingBy(r -> r.getEspacio() == null ? "Sin espacio" : r.getEspacio().getNombre(), java.util.stream.Collectors.counting()));
        long totalPersonas = reservas.stream().mapToLong(r -> r.getCantidadPersonas() == null ? 0 : r.getCantidadPersonas()).sum();
        return Map.of("total", reservas.size(), "porEstado", porEstado,
                "proximas", reservas.stream().filter(r -> !r.getFecha().isBefore(LocalDate.now()) && estadosActivos().contains(r.getEstado())).count(),
                "totalPersonas", totalPersonas, "porEspacio", ordenar(porEspacio), "porEspacioSemana", ordenar(porEspacioSemana), "porLugar", ordenar(porLugar), "porMes", porMes,
                "inicioSemana", inicioSemana.toString());
    }

    private Map<String, Long> ordenar(Map<String, Long> datos) {
        return datos.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    }

    @GetMapping(value = "/reservas.csv", produces = "text/csv")
    public ResponseEntity<byte[]> reservasCsv(@RequestParam(required = false) LocalDate desde,
                                               @RequestParam(required = false) LocalDate hasta,
                                               @RequestParam(required = false) EstadoReserva estado,
                                               @RequestParam(required = false) String secciones) {
        List<Reserva> reservas = filtrar(desde, hasta, estado);
        StringBuilder csv = new StringBuilder("ID,Fecha,Hora inicio,Hora fin,Estado,Personas,Lugar,Espacio,Usuario\r\n");
        reservas.forEach(r -> csv.append(r.getId()).append(',').append(r.getFecha()).append(',').append(r.getHoraInicio()).append(',')
                .append(r.getHoraFin()).append(',').append(r.getEstado()).append(',').append(r.getCantidadPersonas()).append(',')
                .append(celda(r.getEspacio().getLugar() == null ? "Sin lugar" : r.getEspacio().getLugar().getNombre())).append(',')
                .append(celda(r.getEspacio() == null ? "Sin espacio" : r.getEspacio().getNombre())).append(',')
                .append(celda(r.getUsuario() == null ? "Sin usuario" : r.getUsuario().getCorreo())).append("\r\n"));
        byte[] contenido = ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reservas-" + LocalDate.now() + ".csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(contenido);
    }

    @GetMapping(value = "/reservas.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> reservasPdf(@RequestParam(required = false) LocalDate desde,
                                               @RequestParam(required = false) LocalDate hasta,
                                               @RequestParam(required = false) EstadoReserva estado,
                                               @RequestParam(required = false) String secciones) {
        byte[] contenido = reportePdfService.generar(filtrar(desde, hasta, estado), desde, hasta,
                estado == null ? null : estado.name(), secciones);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reporte-reservas-" + LocalDate.now() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF).body(contenido);
    }

    private List<Reserva> filtrar(LocalDate desde, LocalDate hasta, EstadoReserva estado) {
        if (desde != null && hasta != null && desde.isAfter(hasta))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha inicial no puede ser posterior a la fecha final");
        return reservaRepository.findAllByOrderByFechaDescHoraInicioDesc().stream()
                .filter(r -> desde == null || !r.getFecha().isBefore(desde))
                .filter(r -> hasta == null || !r.getFecha().isAfter(hasta))
                .filter(r -> estado == null || r.getEstado() == estado).toList();
    }

    private String celda(String value) { return "\"" + String.valueOf(value).replace("\"", "\"\"") + "\""; }
    private EnumSet<EstadoReserva> estadosActivos() { return EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA); }
}
