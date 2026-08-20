package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.ReservaRequest;
import cr.or.guiasyscouts.reservas.model.*;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {
    @Mock ReservaRepository reservaRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock EspacioRepository espacioRepository;
    @Mock NotificacionService notificacionService;
    private ReservaService service;

    @BeforeEach
    void configurar() {
        service = new ReservaService(reservaRepository, usuarioRepository, espacioRepository, notificacionService);
    }

    @Test
    void rechazaHorarioAntesDeLasOcho() {
        ReservaRequest request = solicitud(LocalTime.of(7, 59), LocalTime.of(9, 0), 10);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crear("persona@ejemplo.cr", request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertTrue(error.getReason().contains("08:00 a 17:00"));
        verifyNoInteractions(usuarioRepository, espacioRepository, reservaRepository);
    }

    @Test
    void rechazaHoraFinalAnteriorAlInicio() {
        ReservaRequest request = solicitud(LocalTime.of(11, 0), LocalTime.of(10, 0), 10);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crear("persona@ejemplo.cr", request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertTrue(error.getReason().contains("posterior"));
    }

    @Test
    void rechazaCantidadSuperiorALaCapacidad() {
        prepararUsuarioYEspacio(20);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crear("persona@ejemplo.cr", solicitud(LocalTime.of(8, 0), LocalTime.of(9, 0), 21)));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertTrue(error.getReason().contains("capacidad"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void rechazaSolapamientoDeUnaReservaActiva() {
        prepararUsuarioYEspacio(50);
        when(reservaRepository.existeSolapamiento(eq(7L), any(), any(), any(),
                eq(EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA))))
                .thenReturn(true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crear("persona@ejemplo.cr", solicitud(LocalTime.of(10, 0), LocalTime.of(11, 0), 10)));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(error.getReason().contains("reservado"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void creaReservaPendienteCuandoCumpleLasReglas() {
        prepararUsuarioYEspacio(50);
        when(reservaRepository.existeSolapamiento(anyLong(), any(), any(), any(), any())).thenReturn(false);
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.crear("persona@ejemplo.cr",
                solicitud(LocalTime.of(10, 0), LocalTime.of(12, 0), 15));

        assertEquals(EstadoReserva.PENDIENTE.name(), response.estado());
        assertEquals(15, response.cantidadPersonas());
        verify(reservaRepository).save(any(Reserva.class));
        verify(notificacionService).crear(any(), eq(TipoNotificacion.RESERVA), anyString(), anyString());
    }

    private ReservaRequest solicitud(LocalTime inicio, LocalTime fin, int personas) {
        return new ReservaRequest(LocalDate.now().plusDays(1), inicio, fin, personas, 7L);
    }

    private void prepararUsuarioYEspacio(int capacidad) {
        Usuario usuario = new Usuario(); usuario.setCorreo("persona@ejemplo.cr"); usuario.setNombre("Persona");
        Lugar lugar = new Lugar(); lugar.setNombre("Sede"); lugar.setEstado(EstadoLugar.ACTIVO);
        Espacio espacio = new Espacio(); espacio.setNombre("Sala"); espacio.setCapacidad(capacidad);
        espacio.setEstado(EstadoEspacio.DISPONIBLE); espacio.setLugar(lugar);
        ReflectionTestUtils.setField(espacio, "id", 7L);
        when(usuarioRepository.findByCorreoIgnoreCase(anyString())).thenReturn(Optional.of(usuario));
        when(espacioRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(espacio));
    }
}
