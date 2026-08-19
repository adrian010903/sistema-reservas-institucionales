package cr.or.guiasyscouts.reservas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class TarifaService {
    private final BigDecimal tarifaHora;

    public TarifaService(@Value("${app.reservas.tarifa-hora:25000}") BigDecimal tarifaHora) {
        if (tarifaHora.signum() <= 0) throw new IllegalArgumentException("La tarifa por hora debe ser positiva");
        this.tarifaHora = tarifaHora;
    }

    public BigDecimal tarifaHora() { return tarifaHora; }
}
