package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "auditoria")
public class Auditoria {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 160)
    private String actor;
    @Column(nullable = false, length = 60)
    private String accion;
    @Column(nullable = false, length = 60)
    private String recurso;
    @Column(name = "recurso_id")
    private Long recursoId;
    @Column(length = 600)
    private String detalle;
    @Column(name = "creada_en", nullable = false, updatable = false)
    private Instant creadaEn;

    @PrePersist void crearFecha() { creadaEn = Instant.now(); }

    public Long getId() { return id; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    public String getRecurso() { return recurso; }
    public void setRecurso(String recurso) { this.recurso = recurso; }
    public Long getRecursoId() { return recursoId; }
    public void setRecursoId(Long recursoId) { this.recursoId = recursoId; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public Instant getCreadaEn() { return creadaEn; }
}
