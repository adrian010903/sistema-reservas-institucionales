package cr.or.guiasyscouts.reservas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StripePaymentServiceTest {
    @Mock PagoRepository pagoRepository;
    @Mock ReservaRepository reservaRepository;
    @Mock NotificacionService notificacionService;
    @Mock StripeGatewayService stripe;
    private StripePaymentService service;

    @BeforeEach
    void configurar() {
        service = new StripePaymentService(pagoRepository, reservaRepository,
                new TarifaService(new BigDecimal("25000")), notificacionService, stripe);
    }

    @Test
    void crearCheckoutCalculaElMontoYGuardaLaSesionDeStripe() {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        when(reservaRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(reserva));
        when(pagoRepository.findByReservaId(5L)).thenReturn(Optional.empty());
        when(pagoRepository.saveAndFlush(any(Pago.class))).thenAnswer(invocation -> {
            Pago pago = invocation.getArgument(0);
            ReflectionTestUtils.setField(pago, "id", 9L);
            return pago;
        });
        when(stripe.createCheckout(eq(9L), eq(5L), eq("Salón principal"), eq("persona@ejemplo.cr"), eq(5_000_000L)))
                .thenReturn(new StripeGatewayService.Checkout("cs_test_123", "https://stripe.test/pagar"));

        var respuesta = service.crearCheckout("persona@ejemplo.cr", 5L);

        assertEquals("cs_test_123", respuesta.sessionId());
        assertEquals("https://stripe.test/pagar", respuesta.url());
        verify(pagoRepository).save(argThat(pago ->
                pago.getMonto().compareTo(new BigDecimal("50000.00")) == 0
                        && pago.getMetodo() == MetodoPago.STRIPE
                        && pago.getEstado() == EstadoPago.PENDIENTE_VERIFICACION
                        && "cs_test_123".equals(pago.getStripeSessionId())));
    }

    @Test
    void impideCrearCheckoutParaLaReservaDeOtroUsuario() {
        when(reservaRepository.findByIdForUpdate(5L))
                .thenReturn(Optional.of(reservaDe("otra@ejemplo.cr", EstadoReserva.APROBADA)));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crearCheckout("persona@ejemplo.cr", 5L));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verifyNoInteractions(pagoRepository, stripe);
    }

    @Test
    void impideCrearCheckoutSiLaReservaFueCancelada() {
        when(reservaRepository.findByIdForUpdate(5L))
                .thenReturn(Optional.of(reservaDe("persona@ejemplo.cr", EstadoReserva.CANCELADA)));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crearCheckout("persona@ejemplo.cr", 5L));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verifyNoInteractions(stripe);
    }

    @Test
    void impideCrearCheckoutSiYaExisteUnPagoVigente() {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        Pago existente = new Pago(); existente.setReserva(reserva); existente.setEstado(EstadoPago.APROBADO);
        when(reservaRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(reserva));
        when(pagoRepository.findByReservaId(5L)).thenReturn(Optional.of(existente));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crearCheckout("persona@ejemplo.cr", 5L));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(pagoRepository, never()).saveAndFlush(any());
        verifyNoInteractions(stripe);
    }

    @Test
    void confirmarSesionPagadaApruebaElPagoYConfirmaLaReserva() {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        Pago pago = pagoPendiente(reserva);
        when(pagoRepository.findByStripeSessionId("cs_test_123")).thenReturn(Optional.of(pago));
        when(stripe.retrieveSession("cs_test_123"))
                .thenReturn(new StripeGatewayService.SessionStatus("cs_test_123", "paid", "complete"));
        when(reservaRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(reserva));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var respuesta = service.confirmarDesdeStripe("persona@ejemplo.cr", "cs_test_123");

        assertEquals(EstadoPago.APROBADO.name(), respuesta.estado());
        assertEquals(EstadoReserva.CONFIRMADA, reserva.getEstado());
        verify(notificacionService).crear(eq(reserva.getUsuario()), eq(TipoNotificacion.PAGO), anyString(), anyString());
    }

    @Test
    void webhookDeSesionVencidaRechazaElPagoYDevuelveLaReservaAPendiente() throws Exception {
        Reserva reserva = reservaDe("persona@ejemplo.cr", EstadoReserva.APROBADA);
        Pago pago = pagoPendiente(reserva);
        when(pagoRepository.findByStripeSessionId("cs_test_123")).thenReturn(Optional.of(pago));
        var evento = new ObjectMapper().readTree("""
                {"type": "checkout.session.expired", "data": {"object": {"id": "cs_test_123"}}}
                """);

        service.procesarWebhook(evento);

        assertEquals(EstadoPago.RECHAZADO, pago.getEstado());
        assertEquals(EstadoReserva.PENDIENTE, reserva.getEstado());
        verify(pagoRepository).save(pago);
        verifyNoInteractions(notificacionService);
    }

    private Pago pagoPendiente(Reserva reserva) {
        Pago pago = new Pago();
        pago.setReserva(reserva);
        pago.setMonto(new BigDecimal("50000.00"));
        pago.setMetodo(MetodoPago.STRIPE);
        pago.setEstado(EstadoPago.PENDIENTE_VERIFICACION);
        pago.setReferencia("STRIPE-PRUEBA");
        pago.setStripeSessionId("cs_test_123");
        return pago;
    }

    private Reserva reservaDe(String correo, EstadoReserva estado) {
        Usuario usuario = new Usuario(); usuario.setCorreo(correo);
        Espacio espacio = new Espacio(); espacio.setNombre("Salón principal");
        Reserva reserva = new Reserva(); reserva.setUsuario(usuario); reserva.setEspacio(espacio); reserva.setEstado(estado);
        reserva.setHoraInicio(LocalTime.of(9, 0)); reserva.setHoraFin(LocalTime.of(11, 0));
        ReflectionTestUtils.setField(reserva, "id", 5L);
        return reserva;
    }
}
