package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.Auditoria;
import java.time.Instant;

public record AuditoriaResponse(Long id, String actor, String accion, String recurso,
                                Long recursoId, String detalle, Instant creadaEn) {
    public static AuditoriaResponse desde(Auditoria item) {
        return new AuditoriaResponse(item.getId(), item.getActor(), item.getAccion(), item.getRecurso(),
                item.getRecursoId(), item.getDetalle(), item.getCreadaEn());
    }
}
