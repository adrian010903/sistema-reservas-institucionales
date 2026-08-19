package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.PagoResponse;
import cr.or.guiasyscouts.reservas.model.EstadoPago;
import cr.or.guiasyscouts.reservas.service.PagoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/pagos")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminPagoController {
    private final PagoService pagoService;
    public AdminPagoController(PagoService pagoService) { this.pagoService = pagoService; }

    @GetMapping
    public List<PagoResponse> listar() { return pagoService.todos(); }

    @PatchMapping("/{id}/aprobar")
    public PagoResponse aprobar(@PathVariable Long id) { return pagoService.validar(id, EstadoPago.APROBADO); }

    @PatchMapping("/{id}/rechazar")
    public PagoResponse rechazar(@PathVariable Long id) { return pagoService.validar(id, EstadoPago.RECHAZADO); }
}
