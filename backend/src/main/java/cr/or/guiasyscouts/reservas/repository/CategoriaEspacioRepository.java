package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.CategoriaEspacio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaEspacioRepository extends JpaRepository<CategoriaEspacio, Long> {
    boolean existsByNombreIgnoreCase(String nombre);
}
