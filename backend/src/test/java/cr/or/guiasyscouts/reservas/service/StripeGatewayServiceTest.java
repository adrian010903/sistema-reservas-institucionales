package cr.or.guiasyscouts.reservas.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class StripeGatewayServiceTest {
    private static final String WEBHOOK_SECRET = "whsec_prueba_local";

    @Test
    void rechazaCrearCheckoutCuandoFaltaLaClaveSecreta() {
        StripeGatewayService service = new StripeGatewayService("", "", "http://localhost:5173");

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.createCheckout(1L, 2L, "Salón", "persona@example.test", 25000L));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
    }

    @Test
    void rechazaWebhookCuandoFaltaElSecretoDeFirma() {
        StripeGatewayService service = new StripeGatewayService("", "", "http://localhost:5173");

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.verifyWebhook("{}", "t=1,v1=firma"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
    }

    @Test
    void aceptaWebhookConFirmaValidaYDevuelveElEvento() throws Exception {
        StripeGatewayService service = new StripeGatewayService("", WEBHOOK_SECRET, "http://localhost:5173");
        String payload = "{\"id\":\"evt_demo\",\"type\":\"checkout.session.completed\"}";
        String timestamp = Long.toString(Instant.now().getEpochSecond());
        String signature = sign(WEBHOOK_SECRET, timestamp + "." + payload);

        var event = service.verifyWebhook(payload, "t=" + timestamp + ",v1=" + signature);

        assertEquals("evt_demo", event.path("id").asText());
        assertEquals("checkout.session.completed", event.path("type").asText());
    }

    @Test
    void rechazaWebhookConFirmaAlterada() throws Exception {
        StripeGatewayService service = new StripeGatewayService("", WEBHOOK_SECRET, "http://localhost:5173");
        String payload = "{\"id\":\"evt_demo\"}";
        String timestamp = Long.toString(Instant.now().getEpochSecond());
        String signature = sign(WEBHOOK_SECRET, timestamp + "." + payload);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.verifyWebhook(payload + " ", "t=" + timestamp + ",v1=" + signature));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void rechazaWebhookConMarcaDeTiempoVencida() throws Exception {
        StripeGatewayService service = new StripeGatewayService("", WEBHOOK_SECRET, "http://localhost:5173");
        String payload = "{\"id\":\"evt_demo\"}";
        String timestamp = Long.toString(Instant.now().minusSeconds(301).getEpochSecond());
        String signature = sign(WEBHOOK_SECRET, timestamp + "." + payload);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.verifyWebhook(payload, "t=" + timestamp + ",v1=" + signature));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    private String sign(String secret, String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }
}
