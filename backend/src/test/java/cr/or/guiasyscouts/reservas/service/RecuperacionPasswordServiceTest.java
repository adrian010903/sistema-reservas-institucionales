package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.PasswordResetToken;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.repository.PasswordResetTokenRepository;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RecuperacionPasswordServiceTest {
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final CorreoService correo = mock(CorreoService.class);
    private final RecuperacionPasswordService service = new RecuperacionPasswordService(
            usuarios, tokens, encoder, correo, true, "http://localhost:5173");

    @Test
    void invalidaSolicitudesAnterioresAntesDeCrearUnaNueva() {
        Usuario usuario = usuario();
        when(usuarios.findByCorreoIgnoreCase(usuario.getCorreo())).thenReturn(Optional.of(usuario));
        when(tokens.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.solicitar(usuario.getCorreo());

        verify(tokens).deleteByExpiraEnBefore(any(Instant.class));
        verify(tokens).invalidarActivosDeUsuario(usuario.getId());
        verify(tokens).save(argThat(token -> token.getTokenHash().length() == 64 && token.getExpiraEn().isAfter(Instant.now())));
        assertNotNull(response.tokenDesarrollo());
        verify(correo).enviar(eq(usuario.getCorreo()), eq("Recuperación de acceso"), contains("resetToken="));
    }

    @Test
    void confirmarTokenIncrementaVersionYEvitaReutilizacion() {
        Usuario usuario = usuario();
        PasswordResetToken token = new PasswordResetToken(); token.setUsuario(usuario);
        token.setTokenHash("hash"); token.setExpiraEn(Instant.now().plusSeconds(300));
        when(tokens.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(encoder.encode("NuevaClave1")).thenReturn("nuevo-hash");

        service.confirmar("token-plano", "NuevaClave1");

        assertEquals("nuevo-hash", usuario.getPasswordHash());
        assertEquals(1, usuario.getTokenVersion());
        assertTrue(token.isUsado());
        verify(usuarios).save(usuario);
        verify(tokens).save(token);
    }

    private Usuario usuario() {
        Usuario usuario = new Usuario(); usuario.setCorreo("persona@ejemplo.cr"); usuario.setNombre("Persona");
        usuario.setPasswordHash("hash-anterior"); ReflectionTestUtils.setField(usuario, "id", 8L); return usuario;
    }
}
