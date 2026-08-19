package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.Reserva;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaResponse(Long id, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin,
                              Integer cantidadPersonas, String estado, Long espacioId, String espacio,
                              String correoUsuario) {
    public static ReservaResponse desde(Reserva reserva) {
        return new ReservaResponse(reserva.getId(), reserva.getFecha(), reserva.getHoraInicio(), reserva.getHoraFin(),
                reserva.getCantidadPersonas(), reserva.getEstado().name(), reserva.getEspacio().getId(),
                reserva.getEspacio().getNombre(), reserva.getUsuario().getCorreo());
    }
}
