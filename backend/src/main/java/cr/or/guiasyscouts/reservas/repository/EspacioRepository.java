package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.EstadoEspacio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EspacioRepository extends JpaRepository<Espacio, Long> {
    List<Espacio> findByEstado(EstadoEspacio estado);
}
