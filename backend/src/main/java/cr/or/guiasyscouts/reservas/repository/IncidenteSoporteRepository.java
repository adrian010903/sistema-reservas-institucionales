package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.IncidenteSoporte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IncidenteSoporteRepository extends JpaRepository<IncidenteSoporte, Long> {
    Optional<IncidenteSoporte> findFirstByHuellaAndEstadoOrderByUltimaVezDesc(String huella, String estado);
    List<IncidenteSoporte> findTop100ByOrderByUltimaVezDesc();
    long countByEstado(String estado);
}
