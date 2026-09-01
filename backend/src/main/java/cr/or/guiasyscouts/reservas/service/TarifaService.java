package cr.or.guiasyscouts.reservas.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class TarifaService {
    private volatile BigDecimal tarifaHora;

    public TarifaService(@Value("${app.reservas.tarifa-hora:25000}") BigDecimal tarifaHora) {
        this.tarifaHora = validar(tarifaHora);
    }

    public BigDecimal tarifaHora() { return tarifaHora; }

    public synchronized BigDecimal actualizarTarifa(BigDecimal nuevaTarifa) {
        this.tarifaHora = validar(nuevaTarifa);
        return this.tarifaHora;
    }

    private BigDecimal validar(BigDecimal tarifa) {
        if (tarifa == null || tarifa.signum() <= 0) {
            throw new IllegalArgumentException("La tarifa por hora debe ser positiva");
        }
        return tarifa.setScale(2, RoundingMode.HALF_UP);
    }
}
