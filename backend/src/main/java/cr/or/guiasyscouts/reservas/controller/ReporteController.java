package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Reserva;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/reportes")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class ReporteController {
    private final ReservaRepository reservaRepository;
    public ReporteController(ReservaRepository reservaRepository) { this.reservaRepository = reservaRepository; }

    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        List<Reserva> reservas = reservaRepository.findAll();
        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoReserva estado : EstadoReserva.values()) porEstado.put(estado.name(), reservas.stream().filter(r -> r.getEstado() == estado).count());
        return Map.of("total", reservas.size(), "porEstado", porEstado,
                "proximas", reservas.stream().filter(r -> !r.getFecha().isBefore(LocalDate.now()) && estadosActivos().contains(r.getEstado())).count());
    }

    @GetMapping(value = "/reservas.csv", produces = "text/csv")
    public ResponseEntity<byte[]> reservasCsv(@RequestParam(required = false) LocalDate desde,
                                               @RequestParam(required = false) LocalDate hasta,
                                               @RequestParam(required = false) EstadoReserva estado) {
        List<Reserva> reservas = reservaRepository.findAllByOrderByFechaDescHoraInicioDesc().stream()
                .filter(r -> desde == null || !r.getFecha().isBefore(desde))
                .filter(r -> hasta == null || !r.getFecha().isAfter(hasta))
                .filter(r -> estado == null || r.getEstado() == estado).toList();
        StringBuilder csv = new StringBuilder("ID,Fecha,Hora inicio,Hora fin,Estado,Personas,Lugar,Espacio,Usuario\r\n");
        reservas.forEach(r -> csv.append(r.getId()).append(',').append(r.getFecha()).append(',').append(r.getHoraInicio()).append(',')
                .append(r.getHoraFin()).append(',').append(r.getEstado()).append(',').append(r.getCantidadPersonas()).append(',')
                .append(celda(r.getEspacio().getLugar() == null ? "Sin lugar" : r.getEspacio().getLugar().getNombre())).append(',')
                .append(celda(r.getEspacio().getNombre())).append(',').append(celda(r.getUsuario().getCorreo())).append("\r\n"));
        byte[] contenido = ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reservas-" + LocalDate.now() + ".csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(contenido);
    }

    private String celda(String value) { return "\"" + value.replace("\"", "\"\"") + "\""; }
    private EnumSet<EstadoReserva> estadosActivos() { return EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA); }
}
