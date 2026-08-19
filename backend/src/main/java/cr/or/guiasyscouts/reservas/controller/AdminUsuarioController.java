package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.UsuarioResponse;
import cr.or.guiasyscouts.reservas.dto.AdminUsuarioUpdateRequest;
import cr.or.guiasyscouts.reservas.model.RolUsuario;
import cr.or.guiasyscouts.reservas.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/usuarios")
public class AdminUsuarioController {
    private final UsuarioRepository usuarioRepository;

    public AdminUsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::desde).toList();
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public UsuarioResponse actualizar(Authentication authentication, @PathVariable Long id,
                                      @Valid @RequestBody AdminUsuarioUpdateRequest request) {
        Usuario actor = usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (actor.getRol() != RolUsuario.SUPERADMIN && (usuario.getRol() == RolUsuario.SUPERADMIN || request.rol() == RolUsuario.SUPERADMIN))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un superadministrador puede gestionar ese rol");
        if (actor.getId().equals(usuario.getId()) && request.estado() != usuario.getEstado())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes bloquear tu propia cuenta");
        usuario.setEstado(request.estado()); usuario.setRol(request.rol());
        return UsuarioResponse.desde(usuarioRepository.save(usuario));
    }
}
