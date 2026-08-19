package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaRequest(
        @NotNull LocalDate fecha,
        @NotNull LocalTime horaInicio,
        @NotNull LocalTime horaFin,
        @NotNull @Min(1) Integer cantidadPersonas,
        @NotNull Long espacioId
) { }
