package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.CatalogoRequests.EspacioRequest;
import cr.or.guiasyscouts.reservas.dto.CatalogoRequests.NombreRequest;
import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.EspacioResponse;
import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.NombreResponse;
import cr.or.guiasyscouts.reservas.model.CategoriaEspacio;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.TipoEspacio;
import cr.or.guiasyscouts.reservas.repository.CategoriaEspacioRepository;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.TipoEspacioRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/catalogo")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminCatalogoController {
    private final TipoEspacioRepository tipoRepository;
    private final CategoriaEspacioRepository categoriaRepository;
    private final EspacioRepository espacioRepository;

    public AdminCatalogoController(TipoEspacioRepository tipoRepository, CategoriaEspacioRepository categoriaRepository,
                                   EspacioRepository espacioRepository) {
        this.tipoRepository = tipoRepository;
        this.categoriaRepository = categoriaRepository;
        this.espacioRepository = espacioRepository;
    }

    @GetMapping("/tipos")
    public List<NombreResponse> listarTipos() { return tipoRepository.findAll().stream().map(NombreResponse::tipo).toList(); }

    @PostMapping("/tipos")
    public NombreResponse crearTipo(@Valid @RequestBody NombreRequest request) {
        if (tipoRepository.existsByNombreIgnoreCase(request.nombre().trim())) throw new ResponseStatusException(HttpStatus.CONFLICT, "El tipo ya existe");
        TipoEspacio tipo = new TipoEspacio(); tipo.setNombre(request.nombre().trim()); tipo.setDescripcion(request.descripcion());
        return NombreResponse.tipo(tipoRepository.save(tipo));
    }

    @GetMapping("/categorias")
    public List<NombreResponse> listarCategorias() { return categoriaRepository.findAll().stream().map(NombreResponse::categoria).toList(); }

    @PostMapping("/categorias")
    public NombreResponse crearCategoria(@Valid @RequestBody NombreRequest request) {
        if (categoriaRepository.existsByNombreIgnoreCase(request.nombre().trim())) throw new ResponseStatusException(HttpStatus.CONFLICT, "La categoria ya existe");
        CategoriaEspacio categoria = new CategoriaEspacio(); categoria.setNombre(request.nombre().trim()); categoria.setDescripcion(request.descripcion());
        return NombreResponse.categoria(categoriaRepository.save(categoria));
    }

    @GetMapping("/espacios")
    public List<EspacioResponse> listarEspacios() { return espacioRepository.findAll().stream().map(EspacioResponse::desde).toList(); }

    @PostMapping("/espacios")
    public EspacioResponse crearEspacio(@Valid @RequestBody EspacioRequest request) {
        TipoEspacio tipo = tipoRepository.findById(request.tipoId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo no encontrado"));
        CategoriaEspacio categoria = categoriaRepository.findById(request.categoriaId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria no encontrada"));
        Espacio espacio = new Espacio(); espacio.setNombre(request.nombre().trim()); espacio.setDescripcion(request.descripcion());
        espacio.setCapacidad(request.capacidad()); espacio.setTipo(tipo); espacio.setCategoria(categoria);
        return EspacioResponse.desde(espacioRepository.save(espacio));
    }
}
