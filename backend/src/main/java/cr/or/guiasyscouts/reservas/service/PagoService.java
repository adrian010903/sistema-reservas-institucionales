package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.PagoRequest;
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
import java.util.List;
import java.util.UUID;

@Service
public class PagoService {
    private static final BigDecimal TARIFA_DEMO = new BigDecimal("25000");
    private final PagoRepository pagoRepository;
    private final ReservaRepository reservaRepository;

    public PagoService(PagoRepository pagoRepository, ReservaRepository reservaRepository) {
        this.pagoRepository = pagoRepository;
        this.reservaRepository = reservaRepository;
    }

    @Transactional
    public PagoResponse pagar(String correo, PagoRequest request) {
        Reserva reserva = reservaRepository.findById(request.reservaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (!reserva.getUsuario().getCorreo().equalsIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La reserva no pertenece al usuario");
        if (pagoRepository.existsByReservaId(reserva.getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya tiene un pago registrado");
        if (reserva.getEstado() == EstadoReserva.CANCELADA || reserva.getEstado() == EstadoReserva.RECHAZADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva no admite pagos");

        long minutos = Duration.between(reserva.getHoraInicio(), reserva.getHoraFin()).toMinutes();
        BigDecimal monto = TARIFA_DEMO.multiply(BigDecimal.valueOf(minutos))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        EstadoPago estado = request.metodo() == MetodoPago.TARJETA_MOCK
                ? EstadoPago.APROBADO : EstadoPago.PENDIENTE_VERIFICACION;

        Pago pago = new Pago();
        pago.setReserva(reserva); pago.setMonto(monto); pago.setMetodo(request.metodo()); pago.setEstado(estado);
        pago.setReferencia("CRC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        if (estado == EstadoPago.APROBADO) reserva.setEstado(EstadoReserva.CONFIRMADA);
        reservaRepository.save(reserva);
        return PagoResponse.desde(pagoRepository.save(pago));
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> propios(String correo) {
        return pagoRepository.findByReservaUsuarioCorreoIgnoreCaseOrderByCreadoEnDesc(correo)
                .stream().map(PagoResponse::desde).toList();
    }
}
