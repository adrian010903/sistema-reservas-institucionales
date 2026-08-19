package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Auditoria;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findAllByOrderByCreadaEnDesc(Pageable pageable);
}
