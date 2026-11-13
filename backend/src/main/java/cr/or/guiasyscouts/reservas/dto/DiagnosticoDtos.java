package cr.or.guiasyscouts.reservas.dto;

import cr.or.guiasyscouts.reservas.model.IncidenteSoporte;

import java.time.Instant;
import java.util.List;

public final class DiagnosticoDtos {
    private DiagnosticoDtos() {}

    public record Verificacion(String codigo, String componente, String estado,
                               String resumen, String recomendacion) {}

    public record Incidente(Long id, String codigo, String componente, String severidad,
                            String estado, String titulo, String resumen, String recomendacion,
                            String tipoTecnico, String correlationId, int ocurrencias,
                            Instant primeraVez, Instant ultimaVez, Instant resueltaEn,
                            String resueltaPor) {
        public static Incidente desde(IncidenteSoporte item) {
            return new Incidente(item.getId(), item.getCodigo(), item.getComponente(), item.getSeveridad(),
                    item.getEstado(), item.getTitulo(), item.getResumen(), item.getRecomendacion(),
                    item.getTipoTecnico(), item.getCorrelationId(), item.getOcurrencias(),
                    item.getPrimeraVez(), item.getUltimaVez(), item.getResueltaEn(), item.getResueltaPor());
        }
    }

    public record Resumen(Instant revisadoEn, long tiempoActivoSegundos, long incidentesAbiertos,
                          List<Verificacion> verificaciones, List<Incidente> incidentes) {}
}
