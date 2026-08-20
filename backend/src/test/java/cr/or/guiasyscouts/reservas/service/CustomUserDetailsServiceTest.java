package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.EstadoUsuario;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomUserDetailsServiceTest {
    private final UsuarioRepository repository = mock(UsuarioRepository.class);
    private final CustomUserDetailsService service = new CustomUserDetailsService(repository);

    @Test
    void marcaComoDeshabilitadosBloqueadosEInactivos() {
        for (EstadoUsuario estado : new EstadoUsuario[]{EstadoUsuario.BLOQUEADO, EstadoUsuario.INACTIVO}) {
            Usuario usuario = usuario(estado);
            when(repository.findByCorreoIgnoreCase(usuario.getCorreo())).thenReturn(Optional.of(usuario));
            assertFalse(service.loadUserByUsername(usuario.getCorreo()).isEnabled());
        }
    }

    @Test
    void mantieneHabilitadoAlUsuarioActivo() {
        Usuario usuario = usuario(EstadoUsuario.ACTIVO);
        when(repository.findByCorreoIgnoreCase(usuario.getCorreo())).thenReturn(Optional.of(usuario));
        assertTrue(service.loadUserByUsername(usuario.getCorreo()).isEnabled());
    }

    private Usuario usuario(EstadoUsuario estado) {
        Usuario usuario = new Usuario(); usuario.setCorreo(estado.name().toLowerCase() + "@ejemplo.cr");
        usuario.setPasswordHash("hash"); usuario.setEstado(estado); return usuario;
    }
}
