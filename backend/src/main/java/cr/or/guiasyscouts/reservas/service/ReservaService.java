package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.ReservaRequest;
import cr.or.guiasyscouts.reservas.dto.ReservaResponse;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.EstadoEspacio;
import cr.or.guiasyscouts.reservas.model.EstadoLugar;
import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Reserva;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;

@Service
public class ReservaService {
    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EspacioRepository espacioRepository;

    public ReservaService(ReservaRepository reservaRepository, UsuarioRepository usuarioRepository, EspacioRepository espacioRepository) {
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.espacioRepository = espacioRepository;
    }

    @Transactional
    public ReservaResponse crear(String correo, ReservaRequest request) {
        validarFechaHorario(request.fecha(), request.horaInicio(), request.horaFin());
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Espacio espacio = espacioRepository.findById(request.espacioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
        validarEspacio(espacio, request.cantidadPersonas());
        if (reservaRepository.existeSolapamiento(request.espacioId(), request.fecha(), request.horaInicio(), request.horaFin(),
                EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El espacio ya esta reservado en ese horario");
        }
        Reserva reserva = new Reserva();
        reserva.setFecha(request.fecha()); reserva.setHoraInicio(request.horaInicio()); reserva.setHoraFin(request.horaFin());
        reserva.setCantidadPersonas(request.cantidadPersonas()); reserva.setUsuario(usuario); reserva.setEspacio(espacio);
        return ReservaResponse.desde(reservaRepository.save(reserva));
    }

    @Transactional
    public ReservaResponse editarPropia(String correo, Long id, ReservaRequest request) {
        Reserva reserva = obtenerPropia(correo, id);
        if (!EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA).contains(reserva.getEstado()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se pueden modificar reservas pendientes o aprobadas");
        validarFechaHorario(request.fecha(), request.horaInicio(), request.horaFin());
        Espacio espacio = espacioRepository.findById(request.espacioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
        validarEspacio(espacio, request.cantidadPersonas());
        if (reservaRepository.existeSolapamientoExcluyendo(id, espacio.getId(), request.fecha(), request.horaInicio(), request.horaFin(), estadosOcupados()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El espacio ya esta reservado en ese horario");
        reserva.setFecha(request.fecha()); reserva.setHoraInicio(request.horaInicio()); reserva.setHoraFin(request.horaFin());
        reserva.setCantidadPersonas(request.cantidadPersonas()); reserva.setEspacio(espacio); reserva.setEstado(EstadoReserva.PENDIENTE);
        return ReservaResponse.desde(reservaRepository.save(reserva));
    }

    @Transactional
    public ReservaResponse cancelarPropia(String correo, Long id) {
        Reserva reserva = obtenerPropia(correo, id);
        if (!estadosOcupados().contains(reserva.getEstado()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya no se puede cancelar");
        reserva.setEstado(EstadoReserva.CANCELADA);
        return ReservaResponse.desde(reservaRepository.save(reserva));
    }

    @Transactional(readOnly = true)
    public List<cr.or.guiasyscouts.reservas.dto.CatalogoResponses.EspacioResponse> disponibles(
            LocalDate fecha, LocalTime horaInicio, LocalTime horaFin, Long tipoId, Long lugarId, Integer personas) {
        validarFechaHorario(fecha, horaInicio, horaFin);
        return espacioRepository.findByEstado(EstadoEspacio.DISPONIBLE).stream()
                .filter(e -> e.getLugar() != null && e.getLugar().getEstado() == EstadoLugar.ACTIVO)
                .filter(e -> tipoId == null || e.getTipo().getId().equals(tipoId))
                .filter(e -> lugarId == null || e.getLugar().getId().equals(lugarId))
                .filter(e -> personas == null || e.getCapacidad() >= personas)
                .filter(e -> !reservaRepository.existeSolapamiento(e.getId(), fecha, horaInicio, horaFin, estadosOcupados()))
                .map(cr.or.guiasyscouts.reservas.dto.CatalogoResponses.EspacioResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> propias(String correo) {
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return reservaRepository.findByUsuarioIdOrderByFechaDescHoraInicioDesc(usuario.getId()).stream().map(ReservaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> pendientes() {
        return reservaRepository.findByEstadoOrderByFechaAscHoraInicioAsc(EstadoReserva.PENDIENTE)
                .stream().map(ReservaResponse::desde).toList();
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> todas() {
        return reservaRepository.findAllByOrderByFechaDescHoraInicioDesc().stream().map(ReservaResponse::desde).toList();
    }

    @Transactional
    public ReservaResponse cambiarEstado(Long id, EstadoReserva nuevoEstado) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (reserva.getEstado() != EstadoReserva.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se pueden revisar reservas pendientes");
        }
        reserva.setEstado(nuevoEstado);
        return ReservaResponse.desde(reservaRepository.save(reserva));
    }

    private Reserva obtenerPropia(String correo, Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (!reserva.getUsuario().getCorreo().equalsIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La reserva no pertenece al usuario");
        return reserva;
    }

    private void validarFechaHorario(LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        if (fecha.isBefore(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha debe ser valida y futura");
        if (!horaFin.isAfter(horaInicio)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La hora final debe ser posterior a la inicial");
        if (horaInicio.isBefore(LocalTime.of(8, 0)) || horaFin.isAfter(LocalTime.of(17, 0)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El horario permitido es de 08:00 a 17:00");
    }

    private void validarEspacio(Espacio espacio, Integer personas) {
        if (espacio.getEstado() != EstadoEspacio.DISPONIBLE || espacio.getLugar() == null || espacio.getLugar().getEstado() != EstadoLugar.ACTIVO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El espacio no se encuentra disponible");
        if (personas > espacio.getCapacidad()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad supera la capacidad del espacio");
    }

    private EnumSet<EstadoReserva> estadosOcupados() {
        return EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA);
    }
}
