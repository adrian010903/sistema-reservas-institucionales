package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.MetodoPago;
import jakarta.validation.constraints.NotNull;

public record PagoRequest(@NotNull Long reservaId, @NotNull MetodoPago metodo) { }
