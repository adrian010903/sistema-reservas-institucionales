package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.*;
import cr.or.guiasyscouts.reservas.repository.NotificacionRepository;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {
    @Mock NotificacionRepository repository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock CorreoService correoService;
    private NotificacionService service;

    @BeforeEach
    void configurar() {
        service = new NotificacionService(repository, usuarioRepository, correoService);
    }

    @Test
    void crearGuardaLaNotificacionYEnviaElCorreo() {
        Usuario usuario = usuario("persona@ejemplo.cr", RolUsuario.USUARIO);

        service.crear(usuario, TipoNotificacion.RESERVA, "Reserva aprobada", "Tu reserva fue aprobada.");

        ArgumentCaptor<Notificacion> guardada = ArgumentCaptor.forClass(Notificacion.class);
        verify(repository).save(guardada.capture());
        assertSame(usuario, guardada.getValue().getUsuario());
        assertEquals(TipoNotificacion.RESERVA, guardada.getValue().getTipo());
        assertEquals("Reserva aprobada", guardada.getValue().getTitulo());
        assertFalse(guardada.getValue().isLeida());
        verify(correoService).enviar("persona@ejemplo.cr", "Reserva aprobada", "Tu reserva fue aprobada.");
    }

    @Test
    void administradoresNotificaACadaCuentaAdministrativa() {
        Usuario admin = usuario("admin@ejemplo.cr", RolUsuario.ADMIN);
        Usuario superadmin = usuario("super@ejemplo.cr", RolUsuario.SUPERADMIN);
        when(usuarioRepository.findByRolIn(any())).thenReturn(List.of(admin, superadmin));

        service.administradores(TipoNotificacion.PAGO, "Pago pendiente", "Hay un pago por verificar.");

        verify(repository, times(2)).save(any(Notificacion.class));
        verify(correoService).enviar("admin@ejemplo.cr", "Pago pendiente", "Hay un pago por verificar.");
        verify(correoService).enviar("super@ejemplo.cr", "Pago pendiente", "Hay un pago por verificar.");
    }

    @Test
    void marcarLeidaActualizaLaNotificacionPropia() {
        Notificacion notificacion = notificacionDe("persona@ejemplo.cr");
        when(repository.findById(7L)).thenReturn(Optional.of(notificacion));
        when(repository.save(notificacion)).thenReturn(notificacion);

        var respuesta = service.marcarLeida("PERSONA@ejemplo.cr", 7L);

        assertTrue(respuesta.leida());
        assertTrue(notificacion.isLeida());
    }

    @Test
    void impideMarcarComoLeidaLaNotificacionDeOtroUsuario() {
        Notificacion notificacion = notificacionDe("otra@ejemplo.cr");
        when(repository.findById(7L)).thenReturn(Optional.of(notificacion));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.marcarLeida("persona@ejemplo.cr", 7L));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        assertFalse(notificacion.isLeida());
        verify(repository, never()).save(any());
    }

    @Test
    void marcarLeidaDevuelve404SiLaNotificacionNoExiste() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.marcarLeida("persona@ejemplo.cr", 99L));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    private Notificacion notificacionDe(String correo) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(usuario(correo, RolUsuario.USUARIO));
        notificacion.setTipo(TipoNotificacion.SISTEMA);
        notificacion.setTitulo("Aviso");
        notificacion.setMensaje("Mensaje de prueba");
        return notificacion;
    }

    private Usuario usuario(String correo, RolUsuario rol) {
        Usuario usuario = new Usuario();
        usuario.setCorreo(correo);
        usuario.setRol(rol);
        return usuario;
    }
}
