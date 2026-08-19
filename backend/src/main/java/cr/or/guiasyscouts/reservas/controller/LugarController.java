package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.LugarResponse;
import cr.or.guiasyscouts.reservas.model.EstadoLugar;
import cr.or.guiasyscouts.reservas.repository.LugarRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lugares")
public class LugarController {
    private final LugarRepository lugarRepository;

    public LugarController(LugarRepository lugarRepository) {
        this.lugarRepository = lugarRepository;
    }

    @GetMapping
    public List<LugarResponse> activos() {
        return lugarRepository.findAll().stream()
                .filter(lugar -> lugar.getEstado() == EstadoLugar.ACTIVO)
                .map(LugarResponse::desde)
                .toList();
    }
}
