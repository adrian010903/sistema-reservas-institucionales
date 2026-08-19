package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pagos")
public class Pago {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reserva_id", nullable = false, unique = true)
    private Reserva reserva;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private MetodoPago metodo;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private EstadoPago estado;

    @Column(name = "referencia", nullable = false, unique = true, length = 50)
    private String referencia;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @PrePersist void crearFecha() { creadoEn = Instant.now(); }
    public Long getId() { return id; }
    public Reserva getReserva() { return reserva; }
    public void setReserva(Reserva reserva) { this.reserva = reserva; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public MetodoPago getMetodo() { return metodo; }
    public void setMetodo(MetodoPago metodo) { this.metodo = metodo; }
    public EstadoPago getEstado() { return estado; }
    public void setEstado(EstadoPago estado) { this.estado = estado; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public Instant getCreadoEn() { return creadoEn; }
}
