package cr.or.guiasyscouts.reservas.service;

import com.fasterxml.jackson.databind.JsonNode;
import cr.or.guiasyscouts.reservas.dto.PagoResponse;
import cr.or.guiasyscouts.reservas.model.*;
import cr.or.guiasyscouts.reservas.repository.PagoRepository;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.UUID;

@Service
public class StripePaymentService {
    public record CheckoutResponse(String url, String sessionId) { }

    private final PagoRepository pagoRepository;
    private final ReservaRepository reservaRepository;
    private final TarifaService tarifaService;
    private final NotificacionService notificacionService;
    private final StripeGatewayService stripe;

    public StripePaymentService(PagoRepository pagoRepository, ReservaRepository reservaRepository,
                                TarifaService tarifaService, NotificacionService notificacionService,
                                StripeGatewayService stripe) {
        this.pagoRepository = pagoRepository;
        this.reservaRepository = reservaRepository;
        this.tarifaService = tarifaService;
        this.notificacionService = notificacionService;
        this.stripe = stripe;
    }

    @Transactional
    public CheckoutResponse crearCheckout(String correo, Long reservaId) {
        Reserva reserva = reservaRepository.findByIdForUpdate(reservaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (!reserva.getUsuario().getCorreo().equalsIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La reserva no pertenece al usuario");
        if (reserva.getEstado() == EstadoReserva.CANCELADA || reserva.getEstado() == EstadoReserva.RECHAZADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva no admite pagos");
        Pago previo = pagoRepository.findByReservaId(reservaId).orElse(null);
        if (previo != null && previo.getEstado() != EstadoPago.RECHAZADO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya tiene un pago registrado");

        long minutos = Duration.between(reserva.getHoraInicio(), reserva.getHoraFin()).toMinutes();
        BigDecimal monto = tarifaService.tarifaHora().multiply(BigDecimal.valueOf(minutos))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        if (monto.signum() <= 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "El monto de la reserva debe ser mayor que cero");
        Pago pago = previo == null ? new Pago() : previo;
        pago.setReserva(reserva);
        pago.setMonto(monto);
        pago.setMetodo(MetodoPago.STRIPE);
        pago.setEstado(EstadoPago.PENDIENTE_VERIFICACION);
        pago.setReferencia("STRIPE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        pago.setStripeSessionId(null);
        pago = pagoRepository.saveAndFlush(pago);

        long minorUnits = monto.movePointRight(2).setScale(0, RoundingMode.UNNECESSARY).longValueExact();
        StripeGatewayService.Checkout checkout = stripe.createCheckout(pago.getId(), reservaId,
                reserva.getEspacio().getNombre(), correo, minorUnits);
        pago.setStripeSessionId(checkout.id());
        pagoRepository.save(pago);
        return new CheckoutResponse(checkout.url(), checkout.id());
    }

    @Transactional
    public PagoResponse confirmarDesdeStripe(String correo, String sessionId) {
        Pago pago = pagoRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión de pago no encontrada"));
        if (!pago.getReserva().getUsuario().getCorreo().equalsIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La sesión no pertenece al usuario");
        StripeGatewayService.SessionStatus session = stripe.retrieveSession(sessionId);
        if ("paid".equals(session.paymentStatus())) aprobar(pago);
        return PagoResponse.desde(pagoRepository.save(pago));
    }

    @Transactional
    public PagoResponse cancelarCheckout(String correo, String sessionId) {
        Pago pago = pagoRepository.findByStripeSessionId(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión de pago no encontrada"));
        if (!pago.getReserva().getUsuario().getCorreo().equalsIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La sesión no pertenece al usuario");
        if (pago.getEstado() != EstadoPago.PENDIENTE_VERIFICACION) return PagoResponse.desde(pago);
        StripeGatewayService.SessionStatus status = stripe.retrieveSession(sessionId);
        if ("paid".equals(status.paymentStatus())) {
            aprobar(pago);
        } else if ("open".equals(status.status())) {
            stripe.expireSession(sessionId);
            pago.setEstado(EstadoPago.RECHAZADO);
            pago.getReserva().setEstado(EstadoReserva.PENDIENTE);
            reservaRepository.save(pago.getReserva());
        } else if ("expired".equals(status.status())) {
            pago.setEstado(EstadoPago.RECHAZADO);
            pago.getReserva().setEstado(EstadoReserva.PENDIENTE);
            reservaRepository.save(pago.getReserva());
        }
        return PagoResponse.desde(pagoRepository.save(pago));
    }

    @Transactional
    public void procesarWebhook(JsonNode event) {
        String type = event.path("type").asText();
        JsonNode session = event.path("data").path("object");
        String sessionId = session.path("id").asText("");
        if (sessionId.isBlank()) return;
        Pago pago = pagoRepository.findByStripeSessionId(sessionId).orElse(null);
        if (pago == null || pago.getEstado() != EstadoPago.PENDIENTE_VERIFICACION) return;
        if (("checkout.session.completed".equals(type) || "checkout.session.async_payment_succeeded".equals(type))
                && "paid".equals(session.path("payment_status").asText())) {
            aprobar(pago);
            pagoRepository.save(pago);
        } else if ("checkout.session.expired".equals(type) || "checkout.session.async_payment_failed".equals(type)) {
            pago.setEstado(EstadoPago.RECHAZADO);
            pago.getReserva().setEstado(EstadoReserva.PENDIENTE);
            reservaRepository.save(pago.getReserva());
            pagoRepository.save(pago);
        }
    }

    private void aprobar(Pago pago) {
        if (pago.getEstado() == EstadoPago.APROBADO) return;
        Reserva reserva = reservaRepository.findByIdForUpdate(pago.getReserva().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (reserva.getEstado() == EstadoReserva.CANCELADA || reserva.getEstado() == EstadoReserva.RECHAZADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya no admite pagos");
        pago.setEstado(EstadoPago.APROBADO);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        reservaRepository.save(reserva);
        notificacionService.crear(reserva.getUsuario(), TipoNotificacion.PAGO, "Pago aprobado", "El pago " + pago.getReferencia() + " fue confirmado por Stripe.");
    }
}
