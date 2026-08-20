package cr.or.guiasyscouts.reservas.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private final JwtService service = new JwtService(
            "clave-de-pruebas-con-longitud-segura-123456789", 3_600_000);

    @Test
    void aceptaTokenConMismaVersionDeCredenciales() {
        String token = service.generarToken("persona@ejemplo.cr", 4);

        assertEquals("persona@ejemplo.cr", service.extraerCorreo(token));
        assertTrue(service.esTokenValido(token, "persona@ejemplo.cr", 4));
    }

    @Test
    void rechazaTokenLuegoDeIncrementarVersionDeCredenciales() {
        String tokenAnterior = service.generarToken("persona@ejemplo.cr", 4);

        assertFalse(service.esTokenValido(tokenAnterior, "persona@ejemplo.cr", 5));
    }
}
