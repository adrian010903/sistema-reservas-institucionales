package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.ReservaResponse;
import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.service.ReservaService;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import org.springframework.security.core.Authentication;
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
    private final AuditoriaService auditoriaService;
    public AdminReservaController(ReservaService reservaService, AuditoriaService auditoriaService) {
        this.reservaService = reservaService; this.auditoriaService = auditoriaService;
    }

    @GetMapping("/pendientes")
    public List<ReservaResponse> pendientes() { return reservaService.pendientes(); }

    @GetMapping
    public List<ReservaResponse> todas() { return reservaService.todas(); }

    @PatchMapping("/{id}/aprobar")
    public ReservaResponse aprobar(Authentication auth, @PathVariable Long id) {
        ReservaResponse response = reservaService.cambiarEstado(id, EstadoReserva.APROBADA);
        auditoriaService.registrar(auth.getName(), "APROBAR", "RESERVA", id, "Reserva aprobada");
        return response;
    }

    @PatchMapping("/{id}/rechazar")
    public ReservaResponse rechazar(Authentication auth, @PathVariable Long id) {
        ReservaResponse response = reservaService.cambiarEstado(id, EstadoReserva.RECHAZADA);
        auditoriaService.registrar(auth.getName(), "RECHAZAR", "RESERVA", id, "Reserva rechazada");
        return response;
    }
}
