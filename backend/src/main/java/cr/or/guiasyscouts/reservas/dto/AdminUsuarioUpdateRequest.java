package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.EstadoUsuario;
import cr.or.guiasyscouts.reservas.model.RolUsuario;
import jakarta.validation.constraints.NotNull;

public record AdminUsuarioUpdateRequest(@NotNull EstadoUsuario estado, @NotNull RolUsuario rol) { }
