package cr.or.guiasyscouts.reservas.model;

import jakarta.persistence.*;

@Entity
@Table(name = "lugares")
public class Lugar {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 120)
    private String nombre;
    @Column(length = 500)
    private String descripcion;
    @Column(length = 250)
    private String direccion;
    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private EstadoLugar estado = EstadoLugar.ACTIVO;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public EstadoLugar getEstado() { return estado; }
    public void setEstado(EstadoLugar estado) { this.estado = estado; }
}
