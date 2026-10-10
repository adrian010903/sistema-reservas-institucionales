package cr.or.guiasyscouts.reservas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class CorreoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CorreoService.class);
    private final JavaMailSender mailSender;
    private final boolean habilitado;
    private final String remitente;
    private final String resendApiKey;
    private final String resendFrom;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CorreoService(ObjectProvider<JavaMailSender> mailSenderProvider,
                         @Value("${app.mail.enabled:false}") boolean habilitado,
                         @Value("${app.mail.from:no-reply@reservas.local}") String remitente,
                         @Value("${resend.api-key:}") String resendApiKey,
                         @Value("${resend.from:onboarding@resend.dev}") String resendFrom) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.habilitado = habilitado; this.remitente = remitente;
        this.resendApiKey = resendApiKey; this.resendFrom = resendFrom;
    }

    public boolean enviar(String destinatario, String asunto, String contenido) {
        if (!habilitado) return false;
        if (!resendApiKey.isBlank()) return enviarConResend(destinatario, asunto, contenido);
        if (mailSender == null) {
            LOGGER.error("El correo está habilitado pero no existe un JavaMailSender configurado");
            return false;
        }
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente); mensaje.setTo(destinatario); mensaje.setSubject(asunto); mensaje.setText(contenido);
        try {
            mailSender.send(mensaje);
            return true;
        } catch (MailException exception) {
            LOGGER.error("No se pudo enviar el correo '{}' a {}", asunto, destinatario, exception);
            return false;
        }
    }

    private boolean enviarConResend(String destinatario, String asunto, String contenido) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "from", resendFrom,
                    "to", List.of(destinatario),
                    "subject", asunto,
                    "text", contenido));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.error("Resend rechazó el correo '{}' con HTTP {}", asunto, response.statusCode());
                return false;
            }
            return true;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.error("Se interrumpió el envío del correo '{}' mediante Resend", asunto);
            return false;
        } catch (Exception exception) {
            LOGGER.error("No se pudo enviar el correo '{}' mediante Resend", asunto, exception);
            return false;
        }
    }
}
