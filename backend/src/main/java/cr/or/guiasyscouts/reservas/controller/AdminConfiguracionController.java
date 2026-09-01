package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.TarifaRequest;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import cr.or.guiasyscouts.reservas.service.TarifaService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/admin/configuracion")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminConfiguracionController {
    private final TarifaService tarifaService;
    private final AuditoriaService auditoriaService;

    public AdminConfiguracionController(TarifaService tarifaService, AuditoriaService auditoriaService) {
        this.tarifaService = tarifaService;
        this.auditoriaService = auditoriaService;
    }

    @PutMapping("/tarifa-hora")
    public ConfiguracionResponse actualizarTarifa(Authentication auth, @Valid @RequestBody TarifaRequest request) {
        BigDecimal anterior = tarifaService.tarifaHora();
        BigDecimal actualizada = tarifaService.actualizarTarifa(request.tarifaHora());
        auditoriaService.registrar(auth.getName(), "ACTUALIZAR", "TARIFA", null,
                "Tarifa por hora: " + anterior + " -> " + actualizada);
        return new ConfiguracionResponse("CRC", actualizada);
    }

    public record ConfiguracionResponse(String moneda, BigDecimal tarifaHora) { }
}
