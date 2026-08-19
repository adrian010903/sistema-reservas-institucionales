package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.ReservaRequest;
import cr.or.guiasyscouts.reservas.dto.ReservaResponse;
import cr.or.guiasyscouts.reservas.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservas")
public class ReservaController {
    private final ReservaService reservaService;
    public ReservaController(ReservaService reservaService) { this.reservaService = reservaService; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaResponse crear(Authentication authentication, @Valid @RequestBody ReservaRequest request) {
        return reservaService.crear(authentication.getName(), request);
    }

    @GetMapping("/mias")
    public List<ReservaResponse> propias(Authentication authentication) {
        return reservaService.propias(authentication.getName());
    }
}
