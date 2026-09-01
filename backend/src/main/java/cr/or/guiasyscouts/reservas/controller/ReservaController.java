package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.ReservaRequest;
import cr.or.guiasyscouts.reservas.dto.ReservaRangoRequest;
import cr.or.guiasyscouts.reservas.dto.ReservaResponse;
import cr.or.guiasyscouts.reservas.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;
import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.EspacioResponse;

@RestController
@RequestMapping("/api/v1/reservas")
public class ReservaController {
    private final ReservaService reservaService;
    public ReservaController(ReservaService reservaService) { this.reservaService = reservaService; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaResponse crear(Authentication authentication, @Valid @RequestBody ReservaRequest request) {
        return reservaService.crear(authentication.getName(), request);
    }

    @PostMapping("/rango")
    @ResponseStatus(HttpStatus.CREATED)
    public List<ReservaResponse> crearRango(Authentication authentication, @Valid @RequestBody ReservaRangoRequest request) {
        return reservaService.crearRango(authentication.getName(), request);
    }

    @GetMapping("/mias")
    public List<ReservaResponse> propias(Authentication authentication) {
        return reservaService.propias(authentication.getName());
    }

    @PutMapping("/{id}")
    public ReservaResponse editar(Authentication authentication, @PathVariable Long id, @Valid @RequestBody ReservaRequest request) {
        return reservaService.editarPropia(authentication.getName(), id, request);
    }

    @PatchMapping("/{id}/cancelar")
    public ReservaResponse cancelar(Authentication authentication, @PathVariable Long id) {
        return reservaService.cancelarPropia(authentication.getName(), id);
    }

    @GetMapping("/disponibilidad")
    public List<EspacioResponse> disponibilidad(@RequestParam LocalDate fecha, @RequestParam LocalTime horaInicio,
                                                @RequestParam LocalTime horaFin, @RequestParam(required = false) Long tipoId,
                                                @RequestParam(required = false) Long lugarId,
                                                @RequestParam(required = false) Integer personas) {
        return reservaService.disponibles(fecha, horaInicio, horaFin, tipoId, lugarId, personas);
    }
}
