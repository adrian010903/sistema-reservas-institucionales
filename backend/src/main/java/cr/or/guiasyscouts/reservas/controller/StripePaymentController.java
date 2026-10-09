package cr.or.guiasyscouts.reservas.controller;

import com.fasterxml.jackson.databind.JsonNode;
import cr.or.guiasyscouts.reservas.dto.PagoResponse;
import cr.or.guiasyscouts.reservas.service.StripeGatewayService;
import cr.or.guiasyscouts.reservas.service.StripePaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/pagos/stripe")
public class StripePaymentController {
    private final StripePaymentService payments;
    private final StripeGatewayService stripe;

    public StripePaymentController(StripePaymentService payments, StripeGatewayService stripe) {
        this.payments = payments;
        this.stripe = stripe;
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public StripePaymentService.CheckoutResponse checkout(Authentication authentication,
                                                           @RequestBody CheckoutRequest request) {
        return payments.crearCheckout(authentication.getName(), request.reservaId());
    }

    @GetMapping("/confirmar")
    public PagoResponse confirmar(Authentication authentication, @RequestParam("session_id") String sessionId) {
        return payments.confirmarDesdeStripe(authentication.getName(), sessionId);
    }

    @PostMapping("/cancelar")
    public PagoResponse cancelar(Authentication authentication, @RequestBody CheckoutRequest request) {
        return payments.cancelarCheckout(authentication.getName(), request.sessionId());
    }

    @PostMapping("/webhook")
    public Map<String, Boolean> webhook(@RequestBody String payload,
                                       @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        JsonNode event = stripe.verifyWebhook(payload, signature);
        payments.procesarWebhook(event);
        return Map.of("received", true);
    }

    public record CheckoutRequest(Long reservaId, String sessionId) { }
}
