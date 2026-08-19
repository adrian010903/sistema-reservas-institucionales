package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.RegistroUsuarioRequest;
import cr.or.guiasyscouts.reservas.dto.AuthResponse;
import cr.or.guiasyscouts.reservas.dto.LoginRequest;
import cr.or.guiasyscouts.reservas.dto.UsuarioResponse;
import cr.or.guiasyscouts.reservas.dto.PerfilUpdateRequest;
import cr.or.guiasyscouts.reservas.dto.CambioPasswordRequest;
import cr.or.guiasyscouts.reservas.model.Usuario;
import cr.or.guiasyscouts.reservas.model.EstadoUsuario;
import cr.or.guiasyscouts.reservas.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UsuarioResponse registrar(RegistroUsuarioRequest request) {
        String correo = request.correo().trim().toLowerCase();

        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre().trim());
        usuario.setCorreo(correo);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));

        return UsuarioResponse.desde(usuarioRepository.save(usuario));
    }

    public AuthResponse iniciarSesion(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(request.correo().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (usuario.getEstado() != EstadoUsuario.ACTIVO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario se encuentra bloqueado o inactivo");
        }
        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        return new AuthResponse(jwtService.generarToken(usuario.getCorreo()), "Bearer", UsuarioResponse.desde(usuario));
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(String correoActual, PerfilUpdateRequest request) {
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correoActual)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        String nuevoCorreo = request.correo().trim().toLowerCase();
        usuarioRepository.findByCorreoIgnoreCase(nuevoCorreo).filter(otro -> !otro.getId().equals(usuario.getId()))
                .ifPresent(otro -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado"); });
        usuario.setNombre(request.nombre().trim()); usuario.setCorreo(nuevoCorreo);
        return UsuarioResponse.desde(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarPassword(String correo, CambioPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (!passwordEncoder.matches(request.passwordActual(), usuario.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual es incorrecta");
        if (passwordEncoder.matches(request.passwordNuevo(), usuario.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña nueva debe ser diferente");
        usuario.setPasswordHash(passwordEncoder.encode(request.passwordNuevo())); usuarioRepository.save(usuario);
    }
}
