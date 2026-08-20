package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import cr.or.guiasyscouts.reservas.model.RolUsuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByCorreoIgnoreCase(String correo);

    Optional<Usuario> findByCorreoIgnoreCase(String correo);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where upper(u.correo) = upper(:correo)")
    Optional<Usuario> findByCorreoIgnoreCaseForUpdate(@Param("correo") String correo);
    List<Usuario> findByRolIn(Collection<RolUsuario> roles);
}
