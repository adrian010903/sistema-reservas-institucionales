package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.Pago;
import java.math.BigDecimal;
import java.time.Instant;

public record PagoResponse(Long id, Long reservaId, BigDecimal monto, String moneda,
                           String metodo, String estado, String referencia, Instant creadoEn) {
    public static PagoResponse desde(Pago pago) {
        return new PagoResponse(pago.getId(), pago.getReserva().getId(), pago.getMonto(), "CRC",
                pago.getMetodo().name(), pago.getEstado().name(), pago.getReferencia(), pago.getCreadoEn());
    }
}
