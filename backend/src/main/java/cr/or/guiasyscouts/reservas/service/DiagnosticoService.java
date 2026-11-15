package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.DiagnosticoDtos;
import cr.or.guiasyscouts.reservas.model.IncidenteSoporte;
import cr.or.guiasyscouts.reservas.repository.IncidenteSoporteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class DiagnosticoService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DiagnosticoService.class);
    private static final String ABIERTO = "ABIERTO";
    private static final String RESUELTO = "RESUELTO";
    private final DataSource dataSource;
    private final IncidenteSoporteRepository incidentes;
    private final AuditoriaService auditoria;
    private final String uploadDirectory;
    private final boolean mailEnabled;
    private final boolean mailProviderConfigured;
    private final boolean stripeSecretConfigured;
    private final boolean stripeWebhookConfigured;
    private final long startedAtMillis = System.currentTimeMillis();

    public DiagnosticoService(DataSource dataSource,
                              IncidenteSoporteRepository incidentes,
                              AuditoriaService auditoria,
                              @Value("${app.upload.dir:uploads}") String uploadDirectory,
                              @Value("${app.mail.enabled:false}") boolean mailEnabled,
                              @Value("${resend.api-key:}") String resendApiKey,
                              @Value("${spring.mail.username:}") String mailUsername,
                              @Value("${spring.mail.password:}") String mailPassword,
                              @Value("${stripe.secret-key:}") String stripeSecretKey,
                              @Value("${stripe.webhook-secret:}") String stripeWebhookSecret) {
        this.dataSource = dataSource;
        this.incidentes = incidentes;
        this.auditoria = auditoria;
        this.uploadDirectory = uploadDirectory;
        this.mailEnabled = mailEnabled;
        this.mailProviderConfigured = tieneTexto(resendApiKey)
                || (tieneTexto(mailUsername) && tieneTexto(mailPassword));
        this.stripeSecretConfigured = tieneTexto(stripeSecretKey);
        this.stripeWebhookConfigured = tieneTexto(stripeWebhookSecret);
    }

    public DiagnosticoDtos.Resumen resumen() {
        List<DiagnosticoDtos.Verificacion> checks = verificarComponentes();
        List<DiagnosticoDtos.Incidente> history = incidentes.findTop100ByOrderByUltimaVezDesc()
                .stream().map(DiagnosticoDtos.Incidente::desde).toList();
        return new DiagnosticoDtos.Resumen(Instant.now(), Math.max(0, (System.currentTimeMillis() - startedAtMillis) / 1000),
                incidentes.countByEstado(ABIERTO), checks, history);
    }

    @Scheduled(fixedDelayString = "${app.diagnostics.interval-ms:60000}",
            initialDelayString = "${app.diagnostics.initial-delay-ms:10000}")
    public void revisarAutomaticamente() {
        for (DiagnosticoDtos.Verificacion check : verificarComponentes()) {
            String fingerprint = "HEALTH:" + check.codigo();
            if ("ALERTA".equals(check.estado())) {
                try {
                    registrarIncidente(fingerprint, "DEPENDENCIA_NO_DISPONIBLE", check.componente(), "ALTA",
                            "Problema detectado: " + check.componente(), check.resumen(), check.recomendacion(),
                            null, UUID.randomUUID().toString());
                } catch (RuntimeException exception) {
                    // Una caída de la base puede impedir guardar el incidente; Render conserva el log de respaldo.
                    LOGGER.warn("No se pudo guardar el incidente del chequeo {} ({})", check.codigo(),
                            exception.getClass().getSimpleName());
                }
            } else {
                resolverIncidenteSalud(fingerprint);
            }
        }
    }

    public synchronized String registrarErrorApi(String metodo, Exception exception) {
        String correlationId = UUID.randomUUID().toString();
        Throwable root = causaRaiz(exception);
        String tipo = root.getClass().getSimpleName();
        String method = metodo == null ? "HTTP" : metodo.toUpperCase();
        String codigo = clasificar(tipo, root);
        String componente = componente(codigo);
        String resumen = resumen(codigo);
        String recomendacion = recomendacion(codigo, correlationId);
        String fingerprint = "API:" + method + ":" + tipo;
        try {
            registrarIncidente(fingerprint, codigo, componente, "ALTA", "Error interno del sistema",
                    resumen, recomendacion, tipo, correlationId);
        } catch (RuntimeException persistenceError) {
            // El propio almacenamiento de incidentes puede no estar disponible durante una caída de base de datos.
            LOGGER.error("No se pudo persistir el incidente. correlationId={}, tipo={}", correlationId,
                    persistenceError.getClass().getSimpleName());
        }
        LOGGER.error("Se detectó un error interno. correlationId={}, método={}, tipo={}", correlationId, method, tipo);
        return correlationId;
    }

    @Transactional
    public void resolver(Long id, String actor) {
        IncidenteSoporte incident = incidentes.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el incidente solicitado"));
        if (!ABIERTO.equals(incident.getEstado())) return;
        incident.setEstado(RESUELTO);
        incident.setResueltaEn(Instant.now());
        incident.setResueltaPor(actor);
        incidentes.save(incident);
        auditoria.registrar(actor, "RESOLVER_INCIDENTE", "INCIDENTE", id,
                "Incidente " + incident.getCodigo() + " marcado como resuelto");
    }

    private List<DiagnosticoDtos.Verificacion> verificarComponentes() {
        List<DiagnosticoDtos.Verificacion> checks = new ArrayList<>();
        checks.add(new DiagnosticoDtos.Verificacion("aplicacion", "Aplicación", "OK",
                "El servidor está respondiendo", ""));
        checks.add(verificarBaseDatos());
        checks.add(verificarAlmacenamiento());
        checks.add(verificarCorreo());
        checks.add(verificarStripe());
        return List.copyOf(checks);
    }

    private DiagnosticoDtos.Verificacion verificarBaseDatos() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return new DiagnosticoDtos.Verificacion("base-datos", "Base de datos", "OK",
                        "Conexión verificada", "");
            }
        } catch (SQLException | RuntimeException exception) {
            return new DiagnosticoDtos.Verificacion("base-datos", "Base de datos", "ALERTA",
                    "No fue posible verificar la conexión", "Verifica la URL, credenciales y disponibilidad de TiDB/MySQL en el entorno. No compartas esos valores en una captura.");
        }
        return new DiagnosticoDtos.Verificacion("base-datos", "Base de datos", "ALERTA",
                "La conexión no respondió a tiempo", "Verifica la disponibilidad de TiDB/MySQL y revisa los logs del backend alrededor de la hora indicada.");
    }

    private DiagnosticoDtos.Verificacion verificarAlmacenamiento() {
        try {
            Path probe = Path.of(uploadDirectory).toAbsolutePath().normalize();
            while (probe != null && !Files.exists(probe)) probe = probe.getParent();
            boolean available = probe != null && Files.isDirectory(probe) && Files.isWritable(probe);
            return available
                    ? new DiagnosticoDtos.Verificacion("archivos", "Imágenes", "OK", "El almacenamiento permite guardar archivos", "")
                    : new DiagnosticoDtos.Verificacion("archivos", "Imágenes", "ALERTA", "El almacenamiento no está disponible para escritura", "Revisa que UPLOAD_DIR apunte a un directorio persistente y escribible.");
        } catch (RuntimeException exception) {
            return new DiagnosticoDtos.Verificacion("archivos", "Imágenes", "ALERTA", "No se pudo verificar el almacenamiento", "Revisa la ruta configurada para UPLOAD_DIR y los permisos del servicio.");
        }
    }

    private DiagnosticoDtos.Verificacion verificarCorreo() {
        if (!mailEnabled) {
            return new DiagnosticoDtos.Verificacion("correo", "Correo", "OPCIONAL",
                    "El envío de correo está desactivado", "Activa MAIL_ENABLED y configura Resend o SMTP solo si deseas habilitar esta función.");
        }
        if (mailProviderConfigured) {
            return new DiagnosticoDtos.Verificacion("correo", "Correo", "OK",
                    "Hay un proveedor de correo configurado", "La conexión real se confirma al enviar un mensaje de prueba.");
        }
        return new DiagnosticoDtos.Verificacion("correo", "Correo", "ALERTA",
                "El correo está habilitado, pero falta configurar un proveedor", "Configura RESEND_API_KEY o las credenciales SMTP en el entorno del backend.");
    }

    private DiagnosticoDtos.Verificacion verificarStripe() {
        if (!stripeSecretConfigured && !stripeWebhookConfigured) {
            return new DiagnosticoDtos.Verificacion("stripe", "Stripe", "OPCIONAL",
                    "Stripe no está configurado; los pagos demostrativos siguen disponibles", "Para probar Stripe, configura STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET en el backend.");
        }
        if (stripeSecretConfigured && stripeWebhookConfigured) {
            return new DiagnosticoDtos.Verificacion("stripe", "Stripe", "OK",
                    "Las claves requeridas están presentes", "La conectividad se confirma con un pago de prueba y un evento de webhook.");
        }
        return new DiagnosticoDtos.Verificacion("stripe", "Stripe", "ALERTA",
                "La configuración de Stripe está incompleta", "Configura las dos variables requeridas en el backend; el panel nunca muestra sus valores.");
    }

    private void registrarIncidente(String fingerprint, String codigo, String componente, String severidad,
                                    String titulo, String detalle, String recomendacion,
                                    String tipoTecnico, String correlationId) {
        IncidenteSoporte incident = incidentes.findFirstByHuellaAndEstadoOrderByUltimaVezDesc(fingerprint, ABIERTO)
                .orElseGet(() -> nuevoIncidente(fingerprint, codigo, componente, severidad, titulo,
                        detalle, recomendacion, tipoTecnico));
        Instant now = Instant.now();
        incident.setUltimaVez(now);
        incident.setOcurrencias(incident.getOcurrencias() + 1);
        incident.setCorrelationId(correlationId);
        incidentes.save(incident);
    }

    private IncidenteSoporte nuevoIncidente(String fingerprint, String codigo, String componente, String severidad,
                                             String titulo, String detalle, String recomendacion, String tipoTecnico) {
        IncidenteSoporte incident = new IncidenteSoporte();
        incident.setHuella(fingerprint);
        incident.setCodigo(codigo);
        incident.setComponente(componente);
        incident.setSeveridad(severidad);
        incident.setEstado(ABIERTO);
        incident.setTitulo(titulo);
        incident.setResumen(detalle);
        incident.setRecomendacion(recomendacion);
        incident.setTipoTecnico(tipoTecnico);
        incident.setOcurrencias(0);
        return incident;
    }

    private void resolverIncidenteSalud(String fingerprint) {
        incidentes.findFirstByHuellaAndEstadoOrderByUltimaVezDesc(fingerprint, ABIERTO).ifPresent(incident -> {
            incident.setEstado(RESUELTO);
            incident.setResueltaEn(Instant.now());
            incident.setResueltaPor("Sistema");
            incidentes.save(incident);
        });
    }

    private String clasificar(String type, Throwable root) {
        if (root instanceof DataAccessException || root instanceof SQLException
                || type.toLowerCase().contains("jdbc") || type.toLowerCase().contains("sql")) return "BASE_DATOS_ERROR";
        if (type.toLowerCase().contains("mail") || type.toLowerCase().contains("resend")) return "CORREO_ERROR";
        return "API_UNHANDLED_ERROR";
    }

    private String componente(String codigo) {
        return switch (codigo) {
            case "BASE_DATOS_ERROR" -> "Base de datos";
            case "CORREO_ERROR" -> "Correo";
            default -> "API";
        };
    }

    private String resumen(String codigo) {
        return switch (codigo) {
            case "BASE_DATOS_ERROR" -> "Una operación no pudo completarse por un error de acceso a datos.";
            case "CORREO_ERROR" -> "Una operación de correo falló durante el procesamiento de la solicitud.";
            default -> "Una solicitud terminó con un error inesperado del servidor.";
        };
    }

    private String recomendacion(String codigo, String correlationId) {
        String referencia = "Referencia: " + correlationId + ". ";
        return switch (codigo) {
            case "BASE_DATOS_ERROR" -> referencia + "Verifica el estado de la base de datos y las conexiones del backend; consulta los logs del servicio a esa hora.";
            case "CORREO_ERROR" -> referencia + "Verifica que el proveedor de correo acepte solicitudes y revisa sus logs sin exponer claves.";
            default -> referencia + "Consulta los logs del backend a esa hora y revisa el tipo técnico registrado; no se guardaron contraseñas, tokens ni contenido de la solicitud.";
        };
    }

    private Throwable causaRaiz(Throwable throwable) {
        Throwable current = throwable;
        for (int depth = 0; depth < 10 && current.getCause() != null && current.getCause() != current; depth++) {
            current = current.getCause();
        }
        return current;
    }

    private static boolean tieneTexto(String value) {
        return value != null && !value.isBlank();
    }
}
