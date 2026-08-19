package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.service.TarifaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/configuracion-publica")
public class ConfiguracionPublicaController {
    private final TarifaService tarifaService;
    public ConfiguracionPublicaController(TarifaService tarifaService) { this.tarifaService = tarifaService; }

    @GetMapping
    public ConfiguracionPublica obtener() {
        return new ConfiguracionPublica("CRC", tarifaService.tarifaHora(), "08:00", "17:00");
    }

    public record ConfiguracionPublica(String moneda, BigDecimal tarifaHora, String horaApertura, String horaCierre) { }
}
