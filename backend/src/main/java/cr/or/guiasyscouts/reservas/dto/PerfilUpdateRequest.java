package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PerfilUpdateRequest(
        @NotBlank @Size(max = 120) String nombre,
        @NotBlank @Email @Size(max = 160) String correo
) { }
