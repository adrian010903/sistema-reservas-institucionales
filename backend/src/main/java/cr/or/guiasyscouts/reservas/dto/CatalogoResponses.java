package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.CategoriaEspacio;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.TipoEspacio;
import cr.or.guiasyscouts.reservas.model.Lugar;

public final class CatalogoResponses {
    private CatalogoResponses() { }

    public record NombreResponse(Long id, String nombre, String descripcion) {
        public static NombreResponse tipo(TipoEspacio value) { return new NombreResponse(value.getId(), value.getNombre(), value.getDescripcion()); }
        public static NombreResponse categoria(CategoriaEspacio value) { return new NombreResponse(value.getId(), value.getNombre(), value.getDescripcion()); }
    }

    public record LugarResponse(Long id, String nombre, String descripcion, String direccion, String imagenUrl, String estado) {
        public static LugarResponse desde(Lugar value) { return new LugarResponse(value.getId(), value.getNombre(), value.getDescripcion(), value.getDireccion(), value.getImagenUrl(), value.getEstado().name()); }
    }

    public record EspacioResponse(Long id, String nombre, String descripcion, Integer capacidad, String imagenUrl,
                                  String estado, Long tipoId, String tipo, Long categoriaId, String categoria,
                                  Long lugarId, String lugar) {
        public static EspacioResponse desde(Espacio value) {
            return new EspacioResponse(value.getId(), value.getNombre(), value.getDescripcion(), value.getCapacidad(), value.getImagenUrl(),
                    value.getEstado().name(), value.getTipo().getId(), value.getTipo().getNombre(),
                    value.getCategoria().getId(), value.getCategoria().getNombre(),
                    value.getLugar() == null ? null : value.getLugar().getId(),
                    value.getLugar() == null ? "Sin lugar asignado" : value.getLugar().getNombre());
        }
    }
}
