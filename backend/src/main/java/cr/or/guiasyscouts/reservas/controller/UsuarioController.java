package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.UsuarioResponse;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {
    private final UsuarioRepository usuarioRepository;
    public UsuarioController(UsuarioRepository usuarioRepository) { this.usuarioRepository = usuarioRepository; }

    @GetMapping("/me")
    public UsuarioResponse miPerfil(Authentication authentication) {
        return usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .map(UsuarioResponse::desde)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));
    }
}
