package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Lugar;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LugarRepository extends JpaRepository<Lugar, Long> {
    boolean existsByNombreIgnoreCase(String nombre);
}
