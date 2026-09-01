package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TarifaRequest(
        @NotNull(message = "La tarifa es obligatoria")
        @DecimalMin(value = "0.01", message = "La tarifa debe ser mayor que cero")
        @Digits(integer = 10, fraction = 2, message = "La tarifa admite hasta 10 enteros y 2 decimales")
        BigDecimal tarifaHora
) { }
