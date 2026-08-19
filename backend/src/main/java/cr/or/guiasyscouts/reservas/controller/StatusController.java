package cr.or.guiasyscouts.reservas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class StatusController {

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "sistema", "Sistema Integrado de Reservas Institucionales",
                "organizacion", "Guias y Scouts de Costa Rica",
                "estado", "activo",
                "fechaHora", Instant.now().toString()
        );
    }
}
