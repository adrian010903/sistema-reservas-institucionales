package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class RecuperacionPasswordDtos {
    private RecuperacionPasswordDtos() { }
    public record Solicitud(@NotBlank @Email String correo) { }
    public record Confirmacion(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) String passwordNuevo) { }
    public record Respuesta(String mensaje, String tokenDesarrollo) { }
}
