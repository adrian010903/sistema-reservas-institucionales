package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.EspacioResponse;
import cr.or.guiasyscouts.reservas.model.EstadoEspacio;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/espacios")
public class EspacioController {
    private final EspacioRepository espacioRepository;
    public EspacioController(EspacioRepository espacioRepository) { this.espacioRepository = espacioRepository; }

    @GetMapping
    public List<EspacioResponse> disponibles() {
        return espacioRepository.findByEstado(EstadoEspacio.DISPONIBLE).stream().map(EspacioResponse::desde).toList();
    }
}
