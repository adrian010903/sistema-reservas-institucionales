package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.UsuarioResponse;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import cr.or.guiasyscouts.reservas.service.UsuarioService;
import cr.or.guiasyscouts.reservas.dto.PerfilUpdateRequest;
import cr.or.guiasyscouts.reservas.dto.CambioPasswordRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
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
    private final UsuarioService usuarioService;
    public UsuarioController(UsuarioRepository usuarioRepository, UsuarioService usuarioService) { this.usuarioRepository = usuarioRepository; this.usuarioService = usuarioService; }

    @GetMapping("/me")
    public UsuarioResponse miPerfil(Authentication authentication) {
        return usuarioRepository.findByCorreoIgnoreCase(authentication.getName())
                .map(UsuarioResponse::desde)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuario no encontrado"));
    }

    @PutMapping("/me")
    public UsuarioResponse actualizarPerfil(Authentication authentication, @Valid @RequestBody PerfilUpdateRequest request) {
        return usuarioService.actualizarPerfil(authentication.getName(), request);
    }

    @PatchMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarPassword(Authentication authentication, @Valid @RequestBody CambioPasswordRequest request) {
        usuarioService.cambiarPassword(authentication.getName(), request);
    }
}
