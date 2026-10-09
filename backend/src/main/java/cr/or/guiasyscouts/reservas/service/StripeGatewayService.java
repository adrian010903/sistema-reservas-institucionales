package cr.or.guiasyscouts.reservas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class StripeGatewayService {
    private static final String API = "https://api.stripe.com/v1";
    private final String secretKey;
    private final String webhookSecret;
    private final String frontendUrl;
    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public StripeGatewayService(@Value("${stripe.secret-key:}") String secretKey,
                                @Value("${stripe.webhook-secret:}") String webhookSecret,
                                @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.secretKey = secretKey;
        this.webhookSecret = webhookSecret;
        this.frontendUrl = frontendUrl.replaceAll("/$", "");
    }

    public record Checkout(String id, String url) { }
    public record SessionStatus(String id, String paymentStatus, String status) { }

    public Checkout createCheckout(long paymentId, long reservationId, String spaceName,
                                   String customerEmail, long amountInMinorUnits) {
        requireSecret();
        String form = field("mode", "payment")
                + field("success_url", frontendUrl + "/pagos?stripe_session={CHECKOUT_SESSION_ID}")
                + field("cancel_url", frontendUrl + "/pagos?stripe_cancelled=1")
                + field("customer_email", customerEmail)
                + field("client_reference_id", Long.toString(reservationId))
                + field("line_items[0][price_data][currency]", "crc")
                + field("line_items[0][price_data][unit_amount]", Long.toString(amountInMinorUnits))
                + field("line_items[0][price_data][product_data][name]", "Reserva institucional: " + spaceName)
                + field("line_items[0][quantity]", "1")
                + field("metadata[pagoId]", Long.toString(paymentId))
                + field("metadata[reservaId]", Long.toString(reservationId));
        JsonNode response = request("POST", "/checkout/sessions", form);
        String id = response.path("id").asText("");
        String url = response.path("url").asText("");
        if (id.isBlank() || url.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe no devolvió una sesión de pago válida");
        return new Checkout(id, url);
    }

    public SessionStatus retrieveSession(String sessionId) {
        requireSecret();
        JsonNode response = request("GET", "/checkout/sessions/" + encode(sessionId), null);
        return new SessionStatus(response.path("id").asText(), response.path("payment_status").asText(), response.path("status").asText());
    }

    public SessionStatus expireSession(String sessionId) {
        requireSecret();
        JsonNode response = request("POST", "/checkout/sessions/" + encode(sessionId) + "/expire", "");
        return new SessionStatus(response.path("id").asText(), response.path("payment_status").asText(), response.path("status").asText());
    }

    public JsonNode verifyWebhook(String payload, String signatureHeader) {
        if (webhookSecret.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe webhook no está configurado");
        if (signatureHeader == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Firma de Stripe ausente");
        String timestamp = null;
        String expectedSignature = null;
        for (String part : signatureHeader.split(",")) {
            String[] pair = part.split("=", 2);
            if (pair.length != 2) continue;
            if (pair[0].equals("t")) timestamp = pair[1];
            if (pair[0].equals("v1")) expectedSignature = pair[1];
        }
        try {
            if (timestamp == null || expectedSignature == null || Math.abs(Instant.now().getEpochSecond() - Long.parseLong(timestamp)) > 300)
                throw new IllegalArgumentException("timestamp");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String signed = timestamp + "." + payload;
            String actual = HexFormat.of().formatHex(mac.doFinal(signed.getBytes(StandardCharsets.UTF_8)));
            if (!MessageDigest.isEqual(actual.getBytes(StandardCharsets.US_ASCII), expectedSignature.getBytes(StandardCharsets.US_ASCII)))
                throw new IllegalArgumentException("signature");
            return mapper.readTree(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Firma de webhook de Stripe inválida");
        }
    }

    private JsonNode request(String method, String path, String body) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(API + path))
                    .header("Authorization", "Bearer " + secretKey)
                    .header("Content-Type", "application/x-www-form-urlencoded");
            HttpRequest request = method.equals("GET")
                    ? builder.GET().build()
                    : builder.POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8)).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode json = mapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String message = json.path("error").path("message").asText("Stripe rechazó la solicitud");
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
            }
            return json;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo conectar con Stripe");
        }
    }

    private void requireSecret() {
        if (secretKey.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe no está configurado en el servidor");
    }

    private static String field(String name, String value) { return encode(name) + "=" + encode(value) + "&"; }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
}
