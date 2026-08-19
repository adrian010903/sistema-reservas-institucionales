package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioCorreoIgnoreCaseOrderByCreadaEnDesc(String correo);
    long countByUsuarioCorreoIgnoreCaseAndLeidaFalse(String correo);
}
