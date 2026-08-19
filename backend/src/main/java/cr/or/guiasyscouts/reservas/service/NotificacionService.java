package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.NotificacionResponse;
import cr.or.guiasyscouts.reservas.model.*;
import cr.or.guiasyscouts.reservas.repository.NotificacionRepository;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumSet;
import java.util.List;

@Service
public class NotificacionService {
    private final NotificacionRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final CorreoService correoService;
    public NotificacionService(NotificacionRepository repository, UsuarioRepository usuarioRepository, CorreoService correoService) {
        this.repository = repository; this.usuarioRepository = usuarioRepository; this.correoService = correoService;
    }

    @Transactional
    public void crear(Usuario usuario, TipoNotificacion tipo, String titulo, String mensaje) {
        Notificacion value = new Notificacion(); value.setUsuario(usuario); value.setTipo(tipo); value.setTitulo(titulo); value.setMensaje(mensaje); repository.save(value);
        correoService.enviar(usuario.getCorreo(), titulo, mensaje);
    }

    @Transactional
    public void administradores(TipoNotificacion tipo, String titulo, String mensaje) {
        usuarioRepository.findByRolIn(EnumSet.of(RolUsuario.ADMIN, RolUsuario.SUPERADMIN)).forEach(usuario -> crear(usuario, tipo, titulo, mensaje));
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponse> propias(String correo) { return repository.findByUsuarioCorreoIgnoreCaseOrderByCreadaEnDesc(correo).stream().map(NotificacionResponse::desde).toList(); }

    @Transactional(readOnly = true)
    public long noLeidas(String correo) { return repository.countByUsuarioCorreoIgnoreCaseAndLeidaFalse(correo); }

    @Transactional
    public NotificacionResponse marcarLeida(String correo, Long id) {
        Notificacion value = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificación no encontrada"));
        if (!value.getUsuario().getCorreo().equalsIgnoreCase(correo)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La notificación no pertenece al usuario");
        value.setLeida(true); return NotificacionResponse.desde(repository.save(value));
    }
}
