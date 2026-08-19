package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.ReservaRequest;
import cr.or.guiasyscouts.reservas.dto.ReservaResponse;
import cr.or.guiasyscouts.reservas.model.Espacio;
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
        if (!request.fecha().isAfter(LocalDate.now().minusDays(1))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha debe ser valida y futura");
        }
        if (!request.horaFin().isAfter(request.horaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La hora final debe ser posterior a la inicial");
        }
        if (request.horaInicio().isBefore(LocalTime.of(8, 0)) || request.horaFin().isAfter(LocalTime.of(17, 0))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El horario permitido es de 08:00 a 17:00");
        }
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Espacio espacio = espacioRepository.findById(request.espacioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
        if (request.cantidadPersonas() > espacio.getCapacidad()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad supera la capacidad del espacio");
        }
        if (reservaRepository.existeSolapamiento(request.espacioId(), request.fecha(), request.horaInicio(), request.horaFin(),
                EnumSet.of(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El espacio ya esta reservado en ese horario");
        }
        Reserva reserva = new Reserva();
        reserva.setFecha(request.fecha()); reserva.setHoraInicio(request.horaInicio()); reserva.setHoraFin(request.horaFin());
        reserva.setCantidadPersonas(request.cantidadPersonas()); reserva.setUsuario(usuario); reserva.setEspacio(espacio);
        return ReservaResponse.desde(reservaRepository.save(reserva));
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
}
