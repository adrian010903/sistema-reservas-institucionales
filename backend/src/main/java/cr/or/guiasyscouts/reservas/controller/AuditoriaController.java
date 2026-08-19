package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.AuditoriaResponse;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/auditoria")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AuditoriaController {
    private final AuditoriaService service;
    public AuditoriaController(AuditoriaService service) { this.service = service; }

    @GetMapping
    public List<AuditoriaResponse> recientes(@RequestParam(defaultValue = "100") int limite) {
        return service.recientes(limite);
    }
}
