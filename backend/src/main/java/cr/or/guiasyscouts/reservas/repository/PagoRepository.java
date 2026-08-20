package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pago p where p.id = :id")
    Optional<Pago> findByIdForUpdate(@Param("id") Long id);
    boolean existsByReservaId(Long reservaId);
    Optional<Pago> findByReservaId(Long reservaId);
    List<Pago> findByReservaUsuarioCorreoIgnoreCaseOrderByCreadoEnDesc(String correo);
}
