package cr.or.guiasyscouts.reservas.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ReporteResumenResponse(
        long total,
        long proximas,
        long totalPersonas,
        double totalHoras,
        double porcentajeOcupacion,
        double promedioPersonasPorReserva,
        double porcentajeCancelacion,
        double variacionReservas,
        double variacionHoras,
        boolean tienePeriodoAnterior,
        LocalDate desde,
        LocalDate hasta,
        Map<String, Long> porEstado,
        Map<String, Long> porEspacio,
        Map<String, Long> porLugar,
        Map<String, Long> porEspacioSemana,
        Map<String, Double> porMes,
        Map<String, Double> porTemporada,
        Map<String, Double> porDiaSemana,
        Map<String, Long> porHoraInicio,
        List<UsoEspacio> espaciosUso,
        List<UsoLugar> lugaresUso,
        List<String> recomendaciones
) {
    public record UsoEspacio(Long id, String nombre, String lugar, long reservas, double horas,
                             double porcentajeOcupacion, String nivelUso, String recomendacion) {}

    public record UsoLugar(Long id, String nombre, long reservas, double horas,
                           double porcentajeOcupacion, String nivelUso) {}
}
