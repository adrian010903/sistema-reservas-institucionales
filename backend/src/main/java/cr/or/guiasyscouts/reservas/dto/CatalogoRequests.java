package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class CatalogoRequests {
    private CatalogoRequests() { }

    public record NombreRequest(@NotBlank String nombre, String descripcion) { }

    public record EspacioRequest(
            @NotBlank String nombre,
            String descripcion,
            @NotNull @Min(1) Integer capacidad,
            @NotNull Long tipoId,
            @NotNull Long categoriaId
    ) { }
}
