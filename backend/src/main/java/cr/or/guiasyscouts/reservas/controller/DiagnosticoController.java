package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.DiagnosticoDtos;
import cr.or.guiasyscouts.reservas.service.DiagnosticoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/diagnostico")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class DiagnosticoController {
    private final DiagnosticoService diagnostico;

    public DiagnosticoController(DiagnosticoService diagnostico) {
        this.diagnostico = diagnostico;
    }

    @GetMapping
    public DiagnosticoDtos.Resumen resumen() {
        return diagnostico.resumen();
    }

    @PatchMapping("/incidentes/{id}/resolver")
    public void resolver(@PathVariable Long id, Authentication authentication) {
        try {
            diagnostico.resolver(id, authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe el incidente solicitado");
        }
    }
}
