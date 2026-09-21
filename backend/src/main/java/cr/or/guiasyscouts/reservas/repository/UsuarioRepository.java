package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import cr.or.guiasyscouts.reservas.model.RolUsuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByCorreoIgnoreCase(String correo);

    Optional<Usuario> findByCorreoIgnoreCase(String correo);
    List<Usuario> findByRolIn(Collection<RolUsuario> roles);
}
