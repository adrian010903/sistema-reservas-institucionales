package cr.or.guiasyscouts.reservas.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class CorreoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CorreoService.class);
    private final JavaMailSender mailSender;
    private final boolean habilitado;
    private final String remitente;

    public CorreoService(ObjectProvider<JavaMailSender> mailSenderProvider,
                         @Value("${app.mail.enabled:false}") boolean habilitado,
                         @Value("${app.mail.from:no-reply@reservas.local}") String remitente) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.habilitado = habilitado; this.remitente = remitente;
    }

    public boolean enviar(String destinatario, String asunto, String contenido) {
        if (!habilitado) return false;
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
}
