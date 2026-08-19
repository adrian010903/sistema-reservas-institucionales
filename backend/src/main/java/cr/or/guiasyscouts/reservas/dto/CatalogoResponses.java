package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.CategoriaEspacio;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.TipoEspacio;

public final class CatalogoResponses {
    private CatalogoResponses() { }

    public record NombreResponse(Long id, String nombre, String descripcion) {
        public static NombreResponse tipo(TipoEspacio value) { return new NombreResponse(value.getId(), value.getNombre(), value.getDescripcion()); }
        public static NombreResponse categoria(CategoriaEspacio value) { return new NombreResponse(value.getId(), value.getNombre(), value.getDescripcion()); }
    }

    public record EspacioResponse(Long id, String nombre, String descripcion, Integer capacidad,
                                  String estado, Long tipoId, String tipo, Long categoriaId, String categoria) {
        public static EspacioResponse desde(Espacio value) {
            return new EspacioResponse(value.getId(), value.getNombre(), value.getDescripcion(), value.getCapacidad(),
                    value.getEstado().name(), value.getTipo().getId(), value.getTipo().getNombre(),
                    value.getCategoria().getId(), value.getCategoria().getNombre());
        }
    }
}
