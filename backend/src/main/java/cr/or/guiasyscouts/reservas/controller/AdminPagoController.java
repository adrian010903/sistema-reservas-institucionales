package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.PagoResponse;
import cr.or.guiasyscouts.reservas.model.EstadoPago;
import cr.or.guiasyscouts.reservas.service.PagoService;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/pagos")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminPagoController {
    private final PagoService pagoService;
    private final AuditoriaService auditoriaService;
    public AdminPagoController(PagoService pagoService, AuditoriaService auditoriaService) {
        this.pagoService = pagoService; this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public List<PagoResponse> listar() { return pagoService.todos(); }

    @PatchMapping("/{id}/aprobar")
    public PagoResponse aprobar(Authentication auth, @PathVariable Long id) {
        PagoResponse response = pagoService.validar(id, EstadoPago.APROBADO);
        auditoriaService.registrar(auth.getName(), "APROBAR", "PAGO", id, "Pago aprobado");
        return response;
    }

    @PatchMapping("/{id}/rechazar")
    public PagoResponse rechazar(Authentication auth, @PathVariable Long id) {
        PagoResponse response = pagoService.validar(id, EstadoPago.RECHAZADO);
        auditoriaService.registrar(auth.getName(), "RECHAZAR", "PAGO", id, "Pago rechazado");
        return response;
    }
}
