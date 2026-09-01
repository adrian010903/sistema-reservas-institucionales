package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "configuracion_plataforma")
public class ConfiguracionPlataforma {
    public static final int ID_GLOBAL = 1;

    @Id
    private Integer id;

    @Column(name = "tarifa_hora", nullable = false, precision = 12, scale = 2)
    private BigDecimal tarifaHora;

    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    @PrePersist
    void alCrear() { actualizadoEn = Instant.now(); }

    @PreUpdate
    void alActualizar() { actualizadoEn = Instant.now(); }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BigDecimal getTarifaHora() { return tarifaHora; }
    public void setTarifaHora(BigDecimal tarifaHora) { this.tarifaHora = tarifaHora; }
    public Instant getActualizadoEn() { return actualizadoEn; }
}
