package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.ReservaResponse;
import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.service.ReservaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reservas")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminReservaController {
    private final ReservaService reservaService;
    public AdminReservaController(ReservaService reservaService) { this.reservaService = reservaService; }

    @GetMapping("/pendientes")
    public List<ReservaResponse> pendientes() { return reservaService.pendientes(); }

    @PatchMapping("/{id}/aprobar")
    public ReservaResponse aprobar(@PathVariable Long id) { return reservaService.cambiarEstado(id, EstadoReserva.APROBADA); }

    @PatchMapping("/{id}/rechazar")
    public ReservaResponse rechazar(@PathVariable Long id) { return reservaService.cambiarEstado(id, EstadoReserva.RECHAZADA); }
}
