package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "espacios")
public class Espacio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false)
    private Integer capacidad;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoEspacio estado = EstadoEspacio.DISPONIBLE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_id", nullable = false)
    private TipoEspacio tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaEspacio categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lugar_id")
    private Lugar lugar;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Integer getCapacidad() { return capacidad; }
    public void setCapacidad(Integer capacidad) { this.capacidad = capacidad; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public EstadoEspacio getEstado() { return estado; }
    public void setEstado(EstadoEspacio estado) { this.estado = estado; }
    public TipoEspacio getTipo() { return tipo; }
    public void setTipo(TipoEspacio tipo) { this.tipo = tipo; }
    public CategoriaEspacio getCategoria() { return categoria; }
    public void setCategoria(CategoriaEspacio categoria) { this.categoria = categoria; }
    public Lugar getLugar() { return lugar; }
    public void setLugar(Lugar lugar) { this.lugar = lugar; }
}
