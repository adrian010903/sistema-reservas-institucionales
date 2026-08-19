package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.AuditoriaResponse;
import cr.or.guiasyscouts.reservas.model.Auditoria;
import cr.or.guiasyscouts.reservas.repository.AuditoriaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AuditoriaService {
    private final AuditoriaRepository repository;
    public AuditoriaService(AuditoriaRepository repository) { this.repository = repository; }

    public void registrar(String actor, String accion, String recurso, Long recursoId, String detalle) {
        Auditoria item = new Auditoria();
        item.setActor(actor); item.setAccion(accion); item.setRecurso(recurso);
        item.setRecursoId(recursoId); item.setDetalle(detalle);
        repository.save(item);
    }

    public List<AuditoriaResponse> recientes(int limite) {
        int limiteSeguro = Math.max(1, Math.min(limite, 200));
        return repository.findAllByOrderByCreadaEnDesc(PageRequest.of(0, limiteSeguro))
                .stream().map(AuditoriaResponse::desde).toList();
    }
}
