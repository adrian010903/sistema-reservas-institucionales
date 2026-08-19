package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import cr.or.guiasyscouts.reservas.model.EstadoEspacio;
import cr.or.guiasyscouts.reservas.model.EstadoLugar;

public final class CatalogoRequests {
    private CatalogoRequests() { }

    public record NombreRequest(@NotBlank String nombre, String descripcion) { }

    public record LugarRequest(@NotBlank String nombre, String descripcion, String direccion, EstadoLugar estado) { }

    public record EspacioRequest(
            @NotBlank String nombre,
            String descripcion,
            @NotNull @Min(1) Integer capacidad,
            @NotNull Long tipoId,
            @NotNull Long categoriaId,
            @NotNull Long lugarId,
            EstadoEspacio estado
    ) { }
}
