package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.Usuario;

public record UsuarioResponse(
        Long id,
        String nombre,
        String correo,
        String estado,
        String rol
) {
    public static UsuarioResponse desde(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getCorreo(),
                usuario.getEstado().name(),
                usuario.getRol().name()
        );
    }
}
