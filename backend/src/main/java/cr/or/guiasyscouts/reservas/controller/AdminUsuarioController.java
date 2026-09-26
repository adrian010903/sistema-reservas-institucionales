package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.UsuarioResponse;
import cr.or.guiasyscouts.reservas.dto.AdminUsuarioUpdateRequest;
import cr.or.guiasyscouts.reservas.dto.AdminUsuarioCreateRequest;
import cr.or.guiasyscouts.reservas.model.RolUsuario;
import cr.or.guiasyscouts.reservas.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/usuarios")
public class AdminUsuarioController {
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final PasswordEncoder passwordEncoder;

    public AdminUsuarioController(UsuarioRepository usuarioRepository, AuditoriaService auditoriaService,
                                  PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::desde).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Transactional
    public UsuarioResponse crear(Authentication authentication,
                                  @Valid @RequestBody AdminUsuarioCreateRequest request) {
        Usuario actor = usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        if (actor.getRol() != RolUsuario.SUPERADMIN && request.rol() != RolUsuario.USUARIO)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo un superadministrador puede crear cuentas administrativas");
        String correo = request.correo().trim().toLowerCase();
        if (usuarioRepository.existsByCorreoIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre().trim());
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(request.rol());
        usuario.setEstado(request.estado());
        Usuario guardado = usuarioRepository.save(usuario);
        auditoriaService.registrar(actor.getCorreo(), "CREAR", "USUARIO", guardado.getId(),
                "Rol=" + guardado.getRol() + ", estado=" + guardado.getEstado());
        return UsuarioResponse.desde(guardado);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public UsuarioResponse actualizar(Authentication authentication, @PathVariable Long id,
                                      @Valid @RequestBody AdminUsuarioUpdateRequest request) {
        Usuario actor = usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (actor.getRol() != RolUsuario.SUPERADMIN
                && (usuario.getRol() != RolUsuario.USUARIO || request.rol() != usuario.getRol()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo un superadministrador puede gestionar roles o cuentas administrativas");
        if (actor.getId().equals(usuario.getId())
                && (request.estado() != usuario.getEstado() || request.rol() != usuario.getRol()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes cambiar tu propio rol o estado");
        usuario.setEstado(request.estado()); usuario.setRol(request.rol());
        Usuario guardado = usuarioRepository.save(usuario);
        auditoriaService.registrar(actor.getCorreo(), "ACTUALIZAR", "USUARIO", guardado.getId(),
                "Rol=" + guardado.getRol() + ", estado=" + guardado.getEstado());
        return UsuarioResponse.desde(guardado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    @Transactional
    public void eliminar(Authentication authentication, @PathVariable Long id) {
        Usuario actor = usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (actor.getId().equals(usuario.getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes eliminar tu propia cuenta");
        if (actor.getRol() != RolUsuario.SUPERADMIN && usuario.getRol() != RolUsuario.USUARIO)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo un superadministrador puede eliminar cuentas administrativas");
        try {
            usuarioRepository.delete(usuario);
            usuarioRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar esta cuenta porque tiene reservas, pagos o registros asociados");
        }
        auditoriaService.registrar(actor.getCorreo(), "ELIMINAR", "USUARIO", id,
                "Cuenta eliminada por un administrador");
    }
}
