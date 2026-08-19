package cr.or.guiasyscouts.reservas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class RecuperacionPasswordDtos {
    private RecuperacionPasswordDtos() { }
    public record Solicitud(@NotBlank @Email String correo) { }
    public record Confirmacion(
            @NotBlank String token,
            @NotBlank
            @Size(min = 8, max = 72, message = "La contrasena debe tener entre 8 y 72 caracteres")
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                    message = "La contrasena debe incluir mayuscula, minuscula y numero")
            String passwordNuevo
    ) { }
    public record Respuesta(String mensaje, String tokenDesarrollo) { }
}
