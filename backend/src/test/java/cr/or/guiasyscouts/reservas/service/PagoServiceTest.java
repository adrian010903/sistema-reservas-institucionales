package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.PagoRequest;
import cr.or.guiasyscouts.reservas.model.*;
import cr.or.guiasyscouts.reservas.repository.PagoRepository;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {
    @Mock PagoRepository pagoRepository;
    @Mock ReservaRepository reservaRepository;
    @Mock NotificacionService notificacionService;
    private PagoService service;

    @BeforeEach
    void configurar() {
        service = new PagoService(pagoRepository, reservaRepository, notificacionService);
    }

    @Test
    void tarjetaMockApruebaPagoYConfirmaReserva() {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        when(reservaRepository.findById(5L)).thenReturn(Optional.of(reserva));
        when(pagoRepository.findByReservaId(5L)).thenReturn(Optional.empty());
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.pagar("persona@ejemplo.cr", new PagoRequest(5L, MetodoPago.TARJETA_MOCK));

        assertEquals(EstadoPago.APROBADO.name(), response.estado());
        assertEquals(EstadoReserva.CONFIRMADA, reserva.getEstado());
        assertEquals(new BigDecimal("50000.00"), response.monto());
        assertTrue(response.referencia().startsWith("CRC-"));
        verify(reservaRepository).save(reserva);
    }

    @Test
    void transferenciaQuedaPendienteDeVerificacion() {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        when(reservaRepository.findById(5L)).thenReturn(Optional.of(reserva));
        when(pagoRepository.findByReservaId(5L)).thenReturn(Optional.empty());
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.pagar("persona@ejemplo.cr", new PagoRequest(5L, MetodoPago.TRANSFERENCIA));

        assertEquals(EstadoPago.PENDIENTE_VERIFICACION.name(), response.estado());
        assertEquals(EstadoReserva.APROBADA, reserva.getEstado());
        verify(notificacionService).administradores(eq(TipoNotificacion.PAGO), anyString(), anyString());
    }

    @Test
    void impidePagarReservaDeOtroUsuario() {
        when(reservaRepository.findById(5L)).thenReturn(Optional.of(reservaDe("otra@ejemplo.cr", EstadoReserva.APROBADA)));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.pagar("persona@ejemplo.cr", new PagoRequest(5L, MetodoPago.TARJETA_MOCK)));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verifyNoInteractions(pagoRepository);
    }

    @Test
    void impideSegundoPagoSiElAnteriorNoFueRechazado() {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        Pago existente = new Pago(); existente.setReserva(reserva); existente.setEstado(EstadoPago.APROBADO);
        when(reservaRepository.findById(5L)).thenReturn(Optional.of(reserva));
        when(pagoRepository.findByReservaId(5L)).thenReturn(Optional.of(existente));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.pagar("persona@ejemplo.cr", new PagoRequest(5L, MetodoPago.TARJETA_MOCK)));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(error.getReason().contains("pago registrado"));
        verify(pagoRepository, never()).save(any());
    }

    private Reserva reservaDe(String correo, EstadoReserva estado) {
        Usuario usuario = new Usuario(); usuario.setCorreo(correo);
        Reserva reserva = new Reserva(); reserva.setUsuario(usuario); reserva.setEstado(estado);
        reserva.setHoraInicio(LocalTime.of(9, 0)); reserva.setHoraFin(LocalTime.of(11, 0));
        ReflectionTestUtils.setField(reserva, "id", 5L);
        return reserva;
    }
}
