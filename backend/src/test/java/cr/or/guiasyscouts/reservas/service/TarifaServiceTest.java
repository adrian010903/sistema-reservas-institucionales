package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.ConfiguracionPlataforma;
import cr.or.guiasyscouts.reservas.repository.ConfiguracionPlataformaRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TarifaServiceTest {
    private final ConfiguracionPlataformaRepository repository = mock(ConfiguracionPlataformaRepository.class);
    private final TarifaService service = new TarifaService(new BigDecimal("25000"), repository);

    @Test
    void leeLaTarifaPersistidaCuandoExiste() {
        ConfiguracionPlataforma configuracion = new ConfiguracionPlataforma();
        configuracion.setId(ConfiguracionPlataforma.ID_GLOBAL);
        configuracion.setTarifaHora(new BigDecimal("31415.90"));
        when(repository.findById(ConfiguracionPlataforma.ID_GLOBAL)).thenReturn(Optional.of(configuracion));

        assertEquals(new BigDecimal("31415.90"), service.tarifaHora());
    }

    @Test
    void guardaLaTarifaActualizadaEnLaConfiguracionGlobal() {
        when(repository.findById(ConfiguracionPlataforma.ID_GLOBAL)).thenReturn(Optional.empty());
        when(repository.save(any(ConfiguracionPlataforma.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(new BigDecimal("28000.75"), service.actualizarTarifa(new BigDecimal("28000.75")));

        verify(repository).save(any(ConfiguracionPlataforma.class));
    }
}
