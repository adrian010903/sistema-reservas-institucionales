package cr.or.guiasyscouts.reservas.dto;

public record AuthResponse(
        String token,
        String tipo,
        UsuarioResponse usuario
) {
}
