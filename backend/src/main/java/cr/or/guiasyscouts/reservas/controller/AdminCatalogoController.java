package cr.or.guiasyscouts.reservas.controller;

import cr.or.guiasyscouts.reservas.dto.CatalogoRequests.EspacioRequest;
import cr.or.guiasyscouts.reservas.dto.CatalogoRequests.NombreRequest;
import cr.or.guiasyscouts.reservas.dto.CatalogoRequests.LugarRequest;
import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.EspacioResponse;
import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.NombreResponse;
import cr.or.guiasyscouts.reservas.dto.CatalogoResponses.LugarResponse;
import cr.or.guiasyscouts.reservas.model.CategoriaEspacio;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.TipoEspacio;
import cr.or.guiasyscouts.reservas.model.Lugar;
import cr.or.guiasyscouts.reservas.repository.CategoriaEspacioRepository;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.TipoEspacioRepository;
import cr.or.guiasyscouts.reservas.repository.LugarRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import cr.or.guiasyscouts.reservas.service.AuditoriaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/catalogo")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
public class AdminCatalogoController {
    private final TipoEspacioRepository tipoRepository;
    private final CategoriaEspacioRepository categoriaRepository;
    private final EspacioRepository espacioRepository;
    private final LugarRepository lugarRepository;
    private final AuditoriaService auditoriaService;

    public AdminCatalogoController(TipoEspacioRepository tipoRepository, CategoriaEspacioRepository categoriaRepository,
                                   EspacioRepository espacioRepository, LugarRepository lugarRepository,
                                   AuditoriaService auditoriaService) {
        this.tipoRepository = tipoRepository;
        this.categoriaRepository = categoriaRepository;
        this.espacioRepository = espacioRepository;
        this.lugarRepository = lugarRepository;
        this.auditoriaService = auditoriaService;
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
    public EspacioResponse crearEspacio(Authentication auth, @Valid @RequestBody EspacioRequest request) {
        TipoEspacio tipo = tipoRepository.findById(request.tipoId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo no encontrado"));
        CategoriaEspacio categoria = categoriaRepository.findById(request.categoriaId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria no encontrada"));
        Espacio espacio = new Espacio(); espacio.setNombre(request.nombre().trim()); espacio.setDescripcion(request.descripcion());
        espacio.setCapacidad(request.capacidad()); espacio.setTipo(tipo); espacio.setCategoria(categoria);
        if (request.lugarId() != null) espacio.setLugar(lugarRepository.findById(request.lugarId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lugar no encontrado")));
        if (request.estado() != null) espacio.setEstado(request.estado());
        Espacio guardado = espacioRepository.save(espacio);
        auditoriaService.registrar(auth.getName(), "CREAR", "ESPACIO", guardado.getId(), guardado.getNombre());
        return EspacioResponse.desde(guardado);
    }

    @PutMapping("/espacios/{id}")
    public EspacioResponse editarEspacio(Authentication auth, @PathVariable Long id, @Valid @RequestBody EspacioRequest request) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
        TipoEspacio tipo = tipoRepository.findById(request.tipoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo no encontrado"));
        CategoriaEspacio categoria = categoriaRepository.findById(request.categoriaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria no encontrada"));
        espacio.setNombre(request.nombre().trim());
        espacio.setDescripcion(request.descripcion());
        espacio.setCapacidad(request.capacidad());
        espacio.setTipo(tipo);
        espacio.setCategoria(categoria);
        espacio.setLugar(request.lugarId() == null ? null : lugarRepository.findById(request.lugarId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lugar no encontrado")));
        if (request.estado() != null) espacio.setEstado(request.estado());
        Espacio guardado = espacioRepository.save(espacio);
        auditoriaService.registrar(auth.getName(), "ACTUALIZAR", "ESPACIO", id, guardado.getNombre());
        return EspacioResponse.desde(guardado);
    }

    @GetMapping("/lugares")
    public List<LugarResponse> listarLugares() {
        return lugarRepository.findAll().stream().map(LugarResponse::desde).toList();
    }

    @PostMapping("/lugares")
    public LugarResponse crearLugar(Authentication auth, @Valid @RequestBody LugarRequest request) {
        if (lugarRepository.existsByNombreIgnoreCase(request.nombre().trim()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El lugar ya existe");
        Lugar lugar = new Lugar();
        lugar.setNombre(request.nombre().trim());
        lugar.setDescripcion(request.descripcion());
        lugar.setDireccion(request.direccion());
        if (request.estado() != null) lugar.setEstado(request.estado());
        Lugar guardado = lugarRepository.save(lugar);
        auditoriaService.registrar(auth.getName(), "CREAR", "LUGAR", guardado.getId(), guardado.getNombre());
        return LugarResponse.desde(guardado);
    }

    @PutMapping("/lugares/{id}")
    public LugarResponse editarLugar(Authentication auth, @PathVariable Long id, @Valid @RequestBody LugarRequest request) {
        Lugar lugar = lugarRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lugar no encontrado"));
        lugar.setNombre(request.nombre().trim());
        lugar.setDescripcion(request.descripcion());
        lugar.setDireccion(request.direccion());
        if (request.estado() != null) lugar.setEstado(request.estado());
        Lugar guardado = lugarRepository.save(lugar);
        auditoriaService.registrar(auth.getName(), "ACTUALIZAR", "LUGAR", id, guardado.getNombre());
        return LugarResponse.desde(guardado);
    }

    @DeleteMapping("/lugares/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarLugar(Authentication auth, @PathVariable Long id) {
        Lugar lugar = lugarRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lugar no encontrado"));
        lugar.setEstado(cr.or.guiasyscouts.reservas.model.EstadoLugar.INACTIVO);
        lugarRepository.save(lugar);
        auditoriaService.registrar(auth.getName(), "DESACTIVAR", "LUGAR", id, lugar.getNombre());
    }

    @DeleteMapping("/espacios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarEspacio(Authentication auth, @PathVariable Long id) {
        Espacio espacio = espacioRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
        espacio.setEstado(cr.or.guiasyscouts.reservas.model.EstadoEspacio.INACTIVO);
        espacioRepository.save(espacio);
        auditoriaService.registrar(auth.getName(), "DESACTIVAR", "ESPACIO", id, espacio.getNombre());
    }

    @PostMapping(value = "/espacios/{id}/imagen", consumes = "multipart/form-data")
    public EspacioResponse subirImagen(Authentication auth, @PathVariable Long id, @RequestPart("imagen") MultipartFile imagen) {
        Espacio espacio = espacioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio no encontrado"));
        if (imagen.isEmpty() || imagen.getContentType() == null || !Set.of("image/jpeg", "image/png", "image/webp").contains(imagen.getContentType()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen debe ser JPG, PNG o WEBP");
        if (imagen.getSize() > 5 * 1024 * 1024)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen no puede superar 5 MB");
        String extension = switch (imagen.getContentType()) { case "image/png" -> ".png"; case "image/webp" -> ".webp"; default -> ".jpg"; };
        String nombre = UUID.randomUUID() + extension;
        Path carpeta = Path.of("uploads", "espacios").toAbsolutePath().normalize();
        try {
            Files.createDirectories(carpeta);
            Files.copy(imagen.getInputStream(), carpeta.resolve(nombre), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la imagen");
        }
        espacio.setImagenUrl("/uploads/espacios/" + nombre);
        Espacio guardado = espacioRepository.save(espacio);
        auditoriaService.registrar(auth.getName(), "ACTUALIZAR_IMAGEN", "ESPACIO", id, guardado.getNombre());
        return EspacioResponse.desde(guardado);
    }
}
