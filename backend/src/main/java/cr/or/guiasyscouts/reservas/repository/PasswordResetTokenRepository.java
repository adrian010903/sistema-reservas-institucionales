package cr.or.guiasyscouts.reservas.repository;

import cr.or.guiasyscouts.reservas.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    @Query("select t from PasswordResetToken t where t.tokenHash = :tokenHash")
    Optional<PasswordResetToken> findByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("update PasswordResetToken t set t.usado = true where t.usuario.id = :usuarioId and t.usado = false")
    int invalidarActivosDeUsuario(@Param("usuarioId") Long usuarioId);

    long deleteByExpiraEnBefore(Instant limite);
}
