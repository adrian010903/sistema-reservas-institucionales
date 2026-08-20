package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByUsuarioIdOrderByFechaDescHoraInicioDesc(Long usuarioId);

    List<Reserva> findByEstadoOrderByFechaAscHoraInicioAsc(EstadoReserva estado);
    List<Reserva> findAllByOrderByFechaDescHoraInicioDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reserva r where r.id = :id")
    Optional<Reserva> findByIdForUpdate(@Param("id") Long id);

    @Query("select count(r) > 0 from Reserva r where r.espacio.id = :espacioId and r.fecha = :fecha " +
            "and r.estado in :estados and r.horaInicio < :horaFin and r.horaFin > :horaInicio")
    boolean existeSolapamiento(@Param("espacioId") Long espacioId, @Param("fecha") LocalDate fecha,
                               @Param("horaInicio") LocalTime horaInicio, @Param("horaFin") LocalTime horaFin,
                               @Param("estados") Collection<EstadoReserva> estados);

    @Query("select count(r) > 0 from Reserva r where r.espacio.id = :espacioId and r.id <> :reservaId and r.fecha = :fecha " +
            "and r.estado in :estados and r.horaInicio < :horaFin and r.horaFin > :horaInicio")
    boolean existeSolapamientoExcluyendo(@Param("reservaId") Long reservaId, @Param("espacioId") Long espacioId,
                                         @Param("fecha") LocalDate fecha, @Param("horaInicio") LocalTime horaInicio,
                                         @Param("horaFin") LocalTime horaFin,
                                         @Param("estados") Collection<EstadoReserva> estados);
}
