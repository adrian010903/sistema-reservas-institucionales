package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByUsuarioIdOrderByFechaDescHoraInicioDesc(Long usuarioId);

    List<Reserva> findByEstadoOrderByFechaAscHoraInicioAsc(EstadoReserva estado);

    @Query("select count(r) > 0 from Reserva r where r.espacio.id = :espacioId and r.fecha = :fecha " +
            "and r.estado in :estados and r.horaInicio < :horaFin and r.horaFin > :horaInicio")
    boolean existeSolapamiento(@Param("espacioId") Long espacioId, @Param("fecha") LocalDate fecha,
                               @Param("horaInicio") LocalTime horaInicio, @Param("horaFin") LocalTime horaFin,
                               @Param("estados") Collection<EstadoReserva> estados);
}
