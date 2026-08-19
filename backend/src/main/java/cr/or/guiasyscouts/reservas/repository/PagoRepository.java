package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    boolean existsByReservaId(Long reservaId);
    Optional<Pago> findByReservaId(Long reservaId);
    List<Pago> findByReservaUsuarioCorreoIgnoreCaseOrderByCreadoEnDesc(String correo);
}
