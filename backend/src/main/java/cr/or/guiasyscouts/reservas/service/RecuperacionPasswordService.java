package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.RecuperacionPasswordDtos.Respuesta;
import cr.or.guiasyscouts.reservas.model.PasswordResetToken;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.repository.PasswordResetTokenRepository;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RecuperacionPasswordService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean mostrarTokenDesarrollo;

    public RecuperacionPasswordService(UsuarioRepository usuarioRepository, PasswordResetTokenRepository tokenRepository,
                                       PasswordEncoder passwordEncoder,
                                       @Value("${app.recovery.expose-token:false}") boolean mostrarTokenDesarrollo) {
        this.usuarioRepository = usuarioRepository; this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder; this.mostrarTokenDesarrollo = mostrarTokenDesarrollo;
    }

    @Transactional
    public Respuesta solicitar(String correo) {
        String mensaje = "Si el correo está registrado, se generó una solicitud de recuperación";
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo.trim()).orElse(null);
        if (usuario == null) return new Respuesta(mensaje, null);
        String tokenPlano = UUID.randomUUID() + "-" + UUID.randomUUID();
        PasswordResetToken token = new PasswordResetToken(); token.setTokenHash(hash(tokenPlano)); token.setUsuario(usuario);
        token.setExpiraEn(Instant.now().plus(30, ChronoUnit.MINUTES)); tokenRepository.save(token);
        return new Respuesta(mensaje, mostrarTokenDesarrollo ? tokenPlano : null);
    }

    @Transactional
    public void confirmar(String tokenPlano, String passwordNuevo) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(tokenPlano))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o vencido"));
        if (token.isUsado() || token.getExpiraEn().isBefore(Instant.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido o vencido");
        token.getUsuario().setPasswordHash(passwordEncoder.encode(passwordNuevo)); token.setUsado(true);
        usuarioRepository.save(token.getUsuario()); tokenRepository.save(token);
    }

    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException("SHA-256 no disponible", ex); }
    }
}
