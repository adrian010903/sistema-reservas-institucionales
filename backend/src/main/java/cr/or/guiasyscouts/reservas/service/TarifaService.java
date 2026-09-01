package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.ConfiguracionPlataforma;
import cr.or.guiasyscouts.reservas.repository.ConfiguracionPlataformaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class TarifaService {
    private final ConfiguracionPlataformaRepository configuracionRepository;
    private volatile BigDecimal tarifaHora;

    @Autowired
    public TarifaService(@Value("${app.reservas.tarifa-hora:25000}") BigDecimal tarifaHora,
                         ConfiguracionPlataformaRepository configuracionRepository) {
        this.tarifaHora = validar(tarifaHora);
        this.configuracionRepository = configuracionRepository;
    }

    public TarifaService(BigDecimal tarifaHora) {
        this.tarifaHora = validar(tarifaHora);
        this.configuracionRepository = null;
    }

    public BigDecimal tarifaHora() {
        if (configuracionRepository == null) return tarifaHora;
        return configuracionRepository.findById(ConfiguracionPlataforma.ID_GLOBAL)
                .map(ConfiguracionPlataforma::getTarifaHora)
                .map(this::validar)
                .orElse(tarifaHora);
    }

    @Transactional
    public synchronized BigDecimal actualizarTarifa(BigDecimal nuevaTarifa) {
        this.tarifaHora = validar(nuevaTarifa);
        if (configuracionRepository != null) {
            ConfiguracionPlataforma configuracion = configuracionRepository
                    .findById(ConfiguracionPlataforma.ID_GLOBAL)
                    .orElseGet(() -> {
                        ConfiguracionPlataforma nueva = new ConfiguracionPlataforma();
                        nueva.setId(ConfiguracionPlataforma.ID_GLOBAL);
                        return nueva;
                    });
            configuracion.setTarifaHora(this.tarifaHora);
            configuracionRepository.save(configuracion);
        }
        return this.tarifaHora;
    }

    private BigDecimal validar(BigDecimal tarifa) {
        if (tarifa == null || tarifa.signum() <= 0) {
            throw new IllegalArgumentException("La tarifa por hora debe ser positiva");
        }
        return tarifa.setScale(2, RoundingMode.HALF_UP);
    }
}
