package cr.or.guiasyscouts.reservas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@Service
public class ImagenEspacioService {
    private static final long MAXIMO = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONES = Map.of(
            "image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp");
    private final Path carpeta;
    private final Path carpetaLugares;

    public ImagenEspacioService(@Value("${app.upload.dir:uploads}") String directorio) {
        this.carpeta = Path.of(directorio).toAbsolutePath().normalize().resolve("espacios");
        this.carpetaLugares = Path.of(directorio).toAbsolutePath().normalize().resolve("lugares");
    }

    public String guardar(MultipartFile imagen, String imagenAnterior) {
        return guardarEn(imagen, imagenAnterior, carpeta, "/uploads/espacios/");
    }

    public String guardarLugar(MultipartFile imagen, String imagenAnterior) {
        return guardarEn(imagen, imagenAnterior, carpetaLugares, "/uploads/lugares/");
    }

    private String guardarEn(MultipartFile imagen, String imagenAnterior, Path destino, String prefijo) {
        String tipo = imagen.getContentType();
        if (imagen.isEmpty() || tipo == null || !EXTENSIONES.containsKey(tipo))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen debe ser JPG, PNG o WEBP");
        if (imagen.getSize() > MAXIMO)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen no puede superar 5 MB");
        try {
            byte[] contenido = imagen.getBytes();
            if (!firmaValida(tipo, contenido))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El contenido no corresponde al formato de imagen indicado");
            Files.createDirectories(destino);
            String nombre = UUID.randomUUID() + EXTENSIONES.get(tipo);
            Files.write(destino.resolve(nombre), contenido);
            eliminarAnterior(imagenAnterior, nombre, destino, prefijo);
            return prefijo + nombre;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la imagen");
        }
    }

    boolean firmaValida(String tipo, byte[] contenido) {
        return switch (tipo) {
            case "image/jpeg" -> contenido.length >= 3 && (contenido[0] & 0xff) == 0xff
                    && (contenido[1] & 0xff) == 0xd8 && (contenido[2] & 0xff) == 0xff;
            case "image/png" -> contenido.length >= 8 && (contenido[0] & 0xff) == 0x89
                    && contenido[1] == 0x50 && contenido[2] == 0x4e && contenido[3] == 0x47
                    && contenido[4] == 0x0d && contenido[5] == 0x0a && contenido[6] == 0x1a && contenido[7] == 0x0a;
            case "image/webp" -> contenido.length >= 12 && texto(contenido, 0, "RIFF") && texto(contenido, 8, "WEBP");
            default -> false;
        };
    }

    private boolean texto(byte[] bytes, int offset, String esperado) {
        for (int i = 0; i < esperado.length(); i++) if (bytes[offset + i] != (byte) esperado.charAt(i)) return false;
        return true;
    }

    private void eliminarAnterior(String imagenAnterior, String nombreNuevo, Path destino, String prefijo) throws IOException {
        if (imagenAnterior == null || !imagenAnterior.startsWith(prefijo)) return;
        String nombreAnterior = Path.of(imagenAnterior).getFileName().toString();
        if (!nombreAnterior.equals(nombreNuevo)) Files.deleteIfExists(destino.resolve(nombreAnterior).normalize());
    }
}
