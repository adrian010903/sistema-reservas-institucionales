package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "incidentes_soporte", indexes = {
        @Index(name = "idx_incidente_estado_ultima_vez", columnList = "estado,ultima_vez"),
        @Index(name = "idx_incidente_huella_estado", columnList = "huella,estado")
})
public class IncidenteSoporte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String huella;

    @Column(nullable = false, length = 60)
    private String codigo;

    @Column(nullable = false, length = 50)
    private String componente;

    @Column(nullable = false, length = 20)
    private String severidad;

    @Column(nullable = false, length = 20)
    private String estado = "ABIERTO";

    @Column(nullable = false, length = 160)
    private String titulo;

    @Column(nullable = false, length = 700)
    private String resumen;

    @Column(nullable = false, length = 1000)
    private String recomendacion;

    @Column(name = "tipo_tecnico", length = 100)
    private String tipoTecnico;

    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    @Column(nullable = false)
    private int ocurrencias = 1;

    @Column(name = "primera_vez", nullable = false, updatable = false)
    private Instant primeraVez;

    @Column(name = "ultima_vez", nullable = false)
    private Instant ultimaVez;

    @Column(name = "resuelta_en")
    private Instant resueltaEn;

    @Column(name = "resuelta_por", length = 160)
    private String resueltaPor;

    @PrePersist
    void prepararFechas() {
        Instant ahora = Instant.now();
        if (primeraVez == null) primeraVez = ahora;
        if (ultimaVez == null) ultimaVez = ahora;
    }

    public Long getId() { return id; }
    public String getHuella() { return huella; }
    public void setHuella(String huella) { this.huella = huella; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getComponente() { return componente; }
    public void setComponente(String componente) { this.componente = componente; }
    public String getSeveridad() { return severidad; }
    public void setSeveridad(String severidad) { this.severidad = severidad; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getResumen() { return resumen; }
    public void setResumen(String resumen) { this.resumen = resumen; }
    public String getRecomendacion() { return recomendacion; }
    public void setRecomendacion(String recomendacion) { this.recomendacion = recomendacion; }
    public String getTipoTecnico() { return tipoTecnico; }
    public void setTipoTecnico(String tipoTecnico) { this.tipoTecnico = tipoTecnico; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    public int getOcurrencias() { return ocurrencias; }
    public void setOcurrencias(int ocurrencias) { this.ocurrencias = ocurrencias; }
    public Instant getPrimeraVez() { return primeraVez; }
    public void setPrimeraVez(Instant primeraVez) { this.primeraVez = primeraVez; }
    public Instant getUltimaVez() { return ultimaVez; }
    public void setUltimaVez(Instant ultimaVez) { this.ultimaVez = ultimaVez; }
    public Instant getResueltaEn() { return resueltaEn; }
    public void setResueltaEn(Instant resueltaEn) { this.resueltaEn = resueltaEn; }
    public String getResueltaPor() { return resueltaPor; }
    public void setResueltaPor(String resueltaPor) { this.resueltaPor = resueltaPor; }
}
