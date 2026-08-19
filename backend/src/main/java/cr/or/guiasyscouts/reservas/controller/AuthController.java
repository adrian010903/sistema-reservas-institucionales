package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.RegistroUsuarioRequest;
import cr.or.guiasyscouts.reservas.dto.AuthResponse;
import cr.or.guiasyscouts.reservas.dto.LoginRequest;
import cr.or.guiasyscouts.reservas.dto.UsuarioResponse;
import cr.or.guiasyscouts.reservas.service.UsuarioService;
import cr.or.guiasyscouts.reservas.service.RecuperacionPasswordService;
import cr.or.guiasyscouts.reservas.dto.RecuperacionPasswordDtos;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final RecuperacionPasswordService recuperacionPasswordService;

    public AuthController(UsuarioService usuarioService, RecuperacionPasswordService recuperacionPasswordService) {
        this.usuarioService = usuarioService;
        this.recuperacionPasswordService = recuperacionPasswordService;
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody RegistroUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(request));
    }

    @PostMapping("/login")
    public AuthResponse iniciarSesion(@Valid @RequestBody LoginRequest request) {
        return usuarioService.iniciarSesion(request);
    }

    @PostMapping("/recuperacion/solicitar")
    public RecuperacionPasswordDtos.Respuesta solicitarRecuperacion(@Valid @RequestBody RecuperacionPasswordDtos.Solicitud request) {
        return recuperacionPasswordService.solicitar(request.correo());
    }

    @PostMapping("/recuperacion/confirmar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmarRecuperacion(@Valid @RequestBody RecuperacionPasswordDtos.Confirmacion request) {
        recuperacionPasswordService.confirmar(request.token(), request.passwordNuevo());
    }
}
