package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.TipoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TipoEspacioRepository extends JpaRepository<TipoEspacio, Long> {
    boolean existsByNombreIgnoreCase(String nombre);
}
