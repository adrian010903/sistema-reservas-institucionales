package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.NotificacionResponse;
import cr.or.guiasyscouts.reservas.service.NotificacionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notificaciones")
public class NotificacionController {
    private final NotificacionService service;
    public NotificacionController(NotificacionService service) { this.service = service; }
    @GetMapping public List<NotificacionResponse> propias(Authentication auth) { return service.propias(auth.getName()); }
    @GetMapping("/no-leidas") public Map<String, Long> noLeidas(Authentication auth) { return Map.of("cantidad", service.noLeidas(auth.getName())); }
    @PatchMapping("/{id}/leer") public NotificacionResponse leer(Authentication auth, @PathVariable Long id) { return service.marcarLeida(auth.getName(), id); }
}
