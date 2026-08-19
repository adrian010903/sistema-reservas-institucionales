package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.Notificacion;
import java.time.Instant;

public record NotificacionResponse(Long id, String tipo, String titulo, String mensaje, boolean leida, Instant creadaEn) {
    public static NotificacionResponse desde(Notificacion value) {
        return new NotificacionResponse(value.getId(), value.getTipo().name(), value.getTitulo(), value.getMensaje(), value.isLeida(), value.getCreadaEn());
    }
}
