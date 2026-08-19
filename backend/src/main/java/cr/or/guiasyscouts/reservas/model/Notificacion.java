package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notificaciones")
public class Notificacion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private TipoNotificacion tipo;
    @Column(nullable = false, length = 140)
    private String titulo;
    @Column(nullable = false, length = 600)
    private String mensaje;
    @Column(nullable = false)
    private boolean leida;
    @Column(name = "creada_en", nullable = false, updatable = false)
    private Instant creadaEn;
    @PrePersist void crearFecha() { creadaEn = Instant.now(); }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public TipoNotificacion getTipo() { return tipo; }
    public void setTipo(TipoNotificacion tipo) { this.tipo = tipo; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public boolean isLeida() { return leida; }
    public void setLeida(boolean leida) { this.leida = leida; }
    public Instant getCreadaEn() { return creadaEn; }
}
