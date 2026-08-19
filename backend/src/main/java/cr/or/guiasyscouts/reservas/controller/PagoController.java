package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.PagoRequest;
import cr.or.guiasyscouts.reservas.dto.PagoResponse;
import cr.or.guiasyscouts.reservas.service.PagoService;
import cr.or.guiasyscouts.reservas.service.ComprobantePdfService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1/pagos")
public class PagoController {
    private final PagoService pagoService;
    private final ComprobantePdfService comprobantePdfService;
    public PagoController(PagoService pagoService, ComprobantePdfService comprobantePdfService) { this.pagoService = pagoService; this.comprobantePdfService = comprobantePdfService; }

    @PostMapping("/mock") @ResponseStatus(HttpStatus.CREATED)
    public PagoResponse pagar(Authentication auth, @Valid @RequestBody PagoRequest request) {
        return pagoService.pagar(auth.getName(), request);
    }

    @GetMapping("/mios")
    public List<PagoResponse> propios(Authentication auth) { return pagoService.propios(auth.getName()); }

    @GetMapping("/{id}/comprobante")
    public ResponseEntity<byte[]> comprobante(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=comprobante-pago-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF).body(comprobantePdfService.generar(auth.getName(), id));
    }
}
