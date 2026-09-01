package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.LoginRequest;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {
    @Mock UsuarioRepository usuarioRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    private UsuarioService service;

    @BeforeEach
    void configurar() {
        service = new UsuarioService(usuarioRepository, passwordEncoder, jwtService);
    }

    @Test
    void incrementaLaVersionAntesDeEmitirUnNuevoToken() {
        Usuario usuario = new Usuario();
        usuario.setNombre("Persona");
        usuario.setCorreo("persona@ejemplo.cr");
        usuario.setPasswordHash("hash");
        when(usuarioRepository.findByCorreoIgnoreCaseForUpdate("persona@ejemplo.cr")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("ClaveSegura1", "hash")).thenReturn(true);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generarToken("persona@ejemplo.cr", 1)).thenReturn("token-nuevo");

        var response = service.iniciarSesion(new LoginRequest("persona@ejemplo.cr", "ClaveSegura1"));

        assertEquals(1, usuario.getTokenVersion());
        assertEquals("token-nuevo", response.token());
        verify(usuarioRepository).save(usuario);
        verify(jwtService).generarToken("persona@ejemplo.cr", 1);
    }
}
