package cr.or.guiasyscouts.reservas.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ImagenEspacioServiceTest {
    @TempDir Path temporal;

    @Test
    void rechazaArchivoQueDeclaraPngPeroNoTieneSuFirma() {
        ImagenEspacioService service = new ImagenEspacioService(temporal.toString());
        var archivo = new MockMultipartFile("imagen", "falso.png", "image/png", "contenido ejecutable".getBytes());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.guardar(archivo, null));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertFalse(Files.exists(temporal.resolve("espacios")));
    }

    @Test
    void guardaImagenValidaYEliminaLaAnterior() throws Exception {
        Path carpeta = Files.createDirectories(temporal.resolve("espacios"));
        Files.write(carpeta.resolve("anterior.jpg"), new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff});
        ImagenEspacioService service = new ImagenEspacioService(temporal.toString());
        byte[] png = new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00};
        var archivo = new MockMultipartFile("imagen", "nueva.png", "image/png", png);

        String url = service.guardar(archivo, "/uploads/espacios/anterior.jpg");

        assertTrue(url.matches("/uploads/espacios/[0-9a-f-]+\\.png"));
        assertFalse(Files.exists(carpeta.resolve("anterior.jpg")));
        assertTrue(Files.exists(carpeta.resolve(Path.of(url).getFileName())));
    }

    @Test
    void guardaPortadaDeLugarEnCarpetaIndependiente() {
        ImagenEspacioService service = new ImagenEspacioService(temporal.toString());
        byte[] webp = new byte[]{'R','I','F','F',0,0,0,0,'W','E','B','P'};
        var archivo = new MockMultipartFile("imagen", "lugar.webp", "image/webp", webp);

        String url = service.guardarLugar(archivo, null);

        assertTrue(url.matches("/uploads/lugares/[0-9a-f-]+\\.webp"));
        assertTrue(Files.exists(temporal.resolve("lugares").resolve(Path.of(url).getFileName())));
    }
}
