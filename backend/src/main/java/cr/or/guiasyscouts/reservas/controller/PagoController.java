package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.PagoRequest;
import cr.or.guiasyscouts.reservas.dto.PagoResponse;
import cr.or.guiasyscouts.reservas.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/pagos")
public class PagoController {
    private final PagoService pagoService;
    public PagoController(PagoService pagoService) { this.pagoService = pagoService; }

    @PostMapping("/mock") @ResponseStatus(HttpStatus.CREATED)
    public PagoResponse pagar(Authentication auth, @Valid @RequestBody PagoRequest request) {
        return pagoService.pagar(auth.getName(), request);
    }

    @GetMapping("/mios")
    public List<PagoResponse> propios(Authentication auth) { return pagoService.propios(auth.getName()); }
}
