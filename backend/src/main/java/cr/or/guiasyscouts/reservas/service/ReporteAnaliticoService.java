package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.ReporteResumenResponse;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Lugar;
import cr.or.guiasyscouts.reservas.model.Reserva;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.LugarRepository;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.Month;
import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ReporteAnaliticoService {
    private static final double HORAS_DISPONIBLES_DIA = 9d;
    private static final EnumSet<EstadoReserva> ESTADOS_QUE_OCUPAN = EnumSet.of(
            EstadoReserva.PENDIENTE, EstadoReserva.APROBADA, EstadoReserva.CONFIRMADA);

    private final ReservaRepository reservaRepository;
    private final EspacioRepository espacioRepository;
    private final LugarRepository lugarRepository;

    public ReporteAnaliticoService(ReservaRepository reservaRepository, EspacioRepository espacioRepository,
                                   LugarRepository lugarRepository) {
        this.reservaRepository = reservaRepository;
        this.espacioRepository = espacioRepository;
        this.lugarRepository = lugarRepository;
    }

    public List<Reserva> filtrar(LocalDate desde, LocalDate hasta, EstadoReserva estado, Long lugarId, Long espacioId) {
        validarPeriodo(desde, hasta);
        return reservaRepository.findAllByOrderByFechaDescHoraInicioDesc().stream()
                .filter(r -> desde == null || !r.getFecha().isBefore(desde))
                .filter(r -> hasta == null || !r.getFecha().isAfter(hasta))
                .filter(r -> estado == null || r.getEstado() == estado)
                .filter(r -> lugarId == null || r.getEspacio().getLugar() != null && lugarId.equals(r.getEspacio().getLugar().getId()))
                .filter(r -> espacioId == null || espacioId.equals(r.getEspacio().getId()))
                .toList();
    }

    public ReporteResumenResponse resumen(LocalDate desde, LocalDate hasta, EstadoReserva estado,
                                           Long lugarId, Long espacioId) {
        List<Reserva> filtradas = filtrar(desde, hasta, estado, lugarId, espacioId);
        LocalDate[] periodo = periodoEfectivo(desde, hasta, filtradas);
        long dias = Math.max(1, ChronoUnit.DAYS.between(periodo[0], periodo[1]) + 1);
        List<Reserva> ocupantes = filtradas.stream().filter(r -> ESTADOS_QUE_OCUPAN.contains(r.getEstado())).toList();

        List<Espacio> espacios = espacioRepository.findAll().stream()
                .filter(e -> lugarId == null || e.getLugar() != null && lugarId.equals(e.getLugar().getId()))
                .filter(e -> espacioId == null || espacioId.equals(e.getId()))
                .toList();
        List<Lugar> lugares = lugarRepository.findAll().stream()
                .filter(l -> lugarId == null || lugarId.equals(l.getId()))
                .filter(l -> espacioId == null || espacios.stream().anyMatch(e -> e.getLugar() != null && e.getLugar().getId().equals(l.getId())))
                .toList();

        List<ReporteResumenResponse.UsoEspacio> espaciosUso = espacios.stream().map(espacio -> {
            List<Reserva> datos = ocupantes.stream().filter(r -> espacio.getId().equals(r.getEspacio().getId())).toList();
            double horas = redondear(datos.stream().mapToDouble(this::horas).sum());
            double porcentaje = porcentaje(horas, dias * HORAS_DISPONIBLES_DIA);
            String nivel = nivel(porcentaje);
            return new ReporteResumenResponse.UsoEspacio(espacio.getId(), espacio.getNombre(),
                    espacio.getLugar() == null ? "Sin lugar" : espacio.getLugar().getNombre(), datos.size(), horas,
                    porcentaje, nivel, recomendacion(espacio.getNombre(), nivel, horas));
        }).sorted(Comparator.comparingDouble(ReporteResumenResponse.UsoEspacio::horas).reversed()
                .thenComparing(ReporteResumenResponse.UsoEspacio::nombre)).toList();

        List<ReporteResumenResponse.UsoLugar> lugaresUso = lugares.stream().map(lugar -> {
            List<ReporteResumenResponse.UsoEspacio> datos = espaciosUso.stream().filter(e -> lugar.getNombre().equals(e.lugar())).toList();
            double horas = redondear(datos.stream().mapToDouble(ReporteResumenResponse.UsoEspacio::horas).sum());
            long reservas = datos.stream().mapToLong(ReporteResumenResponse.UsoEspacio::reservas).sum();
            double capacidad = Math.max(1, datos.size()) * dias * HORAS_DISPONIBLES_DIA;
            double porcentaje = porcentaje(horas, capacidad);
            return new ReporteResumenResponse.UsoLugar(lugar.getId(), lugar.getNombre(), reservas, horas,
                    porcentaje, nivel(porcentaje));
        }).sorted(Comparator.comparingDouble(ReporteResumenResponse.UsoLugar::horas).reversed()
                .thenComparing(ReporteResumenResponse.UsoLugar::nombre)).toList();

        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (EstadoReserva value : EstadoReserva.values())
            porEstado.put(value.name(), filtradas.stream().filter(r -> r.getEstado() == value).count());

        Map<String, Double> porMes = new LinkedHashMap<>();
        for (Month mes : Month.values()) {
            String nombre = mes.getDisplayName(TextStyle.SHORT, new Locale("es", "CR")).replace(".", "");
            porMes.put(nombre, redondear(ocupantes.stream().filter(r -> r.getFecha().getMonth() == mes).mapToDouble(this::horas).sum()));
        }
        Map<String, Double> porTemporada = new LinkedHashMap<>();
        porTemporada.put("Ene–Mar", sumarMeses(porMes, 0, 3));
        porTemporada.put("Abr–Jun", sumarMeses(porMes, 3, 6));
        porTemporada.put("Jul–Sep", sumarMeses(porMes, 6, 9));
        porTemporada.put("Oct–Dic", sumarMeses(porMes, 9, 12));

        Map<String, Double> porDiaSemana = new LinkedHashMap<>();
        for (DayOfWeek dia : DayOfWeek.values()) {
            String nombre = dia.getDisplayName(TextStyle.SHORT, new Locale("es", "CR")).replace(".", "");
            porDiaSemana.put(nombre, redondear(ocupantes.stream().filter(r -> r.getFecha().getDayOfWeek() == dia)
                    .mapToDouble(this::horas).sum()));
        }
        Map<String, Long> porHoraInicio = new LinkedHashMap<>();
        for (int hora = 8; hora < 17; hora++) {
            int inicio = hora;
            porHoraInicio.put(String.format("%02d:00", hora), ocupantes.stream()
                    .filter(r -> r.getHoraInicio().getHour() == inicio).count());
        }

        double totalHoras = redondear(ocupantes.stream().mapToDouble(this::horas).sum());
        double capacidadTotal = Math.max(1, espacios.size()) * dias * HORAS_DISPONIBLES_DIA;
        long totalPersonas = ocupantes.stream()
                .mapToLong(r -> r.getCantidadPersonas() == null ? 0 : r.getCantidadPersonas()).sum();
        long canceladas = filtradas.stream().filter(r -> r.getEstado() == EstadoReserva.CANCELADA).count();
        LocalDate anteriorHasta = periodo[0].minusDays(1);
        LocalDate anteriorDesde = anteriorHasta.minusDays(dias - 1);
        List<Reserva> periodoAnterior = filtrar(anteriorDesde, anteriorHasta, estado, lugarId, espacioId);
        List<Reserva> ocupantesAnteriores = periodoAnterior.stream()
                .filter(r -> ESTADOS_QUE_OCUPAN.contains(r.getEstado())).toList();
        double horasAnteriores = ocupantesAnteriores.stream().mapToDouble(this::horas).sum();
        Map<String, Long> porEspacio = new LinkedHashMap<>();
        espaciosUso.forEach(e -> porEspacio.put(e.nombre(), e.reservas()));
        Map<String, Long> porLugar = new LinkedHashMap<>();
        lugaresUso.forEach(l -> porLugar.put(l.nombre(), l.reservas()));
        LocalDate inicioSemana = LocalDate.now().minusDays(6);
        Map<String, Long> porEspacioSemana = ocupantes.stream()
                .filter(r -> !r.getFecha().isBefore(inicioSemana))
                .collect(java.util.stream.Collectors.groupingBy(r -> r.getEspacio().getNombre(), LinkedHashMap::new,
                        java.util.stream.Collectors.counting()));
        List<String> recomendaciones = new ArrayList<>();
        espaciosUso.stream().filter(e -> "ALTO".equals(e.nivelUso())).limit(3).forEach(e -> recomendaciones.add(e.recomendacion()));
        espaciosUso.stream().filter(e -> "BAJO".equals(e.nivelUso())).limit(3).forEach(e -> recomendaciones.add(e.recomendacion()));
        if (recomendaciones.isEmpty()) recomendaciones.add("Todavía no hay suficiente actividad para generar recomendaciones en este período.");

        boolean tienePeriodoAnterior = !periodoAnterior.isEmpty();
        return new ReporteResumenResponse(filtradas.size(), filtradas.stream()
                .filter(r -> !r.getFecha().isBefore(LocalDate.now()) && ESTADOS_QUE_OCUPAN.contains(r.getEstado())).count(),
                totalPersonas, totalHoras, porcentaje(totalHoras, capacidadTotal),
                promedio(totalPersonas, ocupantes.size()), porcentaje(canceladas, filtradas.size()),
                tienePeriodoAnterior ? variacion(filtradas.size(), periodoAnterior.size()) : 0,
                tienePeriodoAnterior ? variacion(totalHoras, horasAnteriores) : 0,
                tienePeriodoAnterior,
                periodo[0], periodo[1], porEstado,
                porEspacio, porLugar, porEspacioSemana, porMes,
                porTemporada, porDiaSemana, porHoraInicio, espaciosUso, lugaresUso, recomendaciones);
    }

    private void validarPeriodo(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha inicial no puede ser posterior a la fecha final");
    }

    private LocalDate[] periodoEfectivo(LocalDate desde, LocalDate hasta, List<Reserva> reservas) {
        LocalDate inicio = desde;
        LocalDate fin = hasta;
        if (inicio == null) inicio = reservas.stream().map(Reserva::getFecha).min(LocalDate::compareTo).orElse(LocalDate.now().withDayOfYear(1));
        if (fin == null) fin = reservas.stream().map(Reserva::getFecha).max(LocalDate::compareTo).orElse(LocalDate.now());
        if (fin.isBefore(inicio)) fin = inicio;
        return new LocalDate[]{inicio, fin};
    }

    private double horas(Reserva reserva) {
        return Math.max(0, Duration.between(reserva.getHoraInicio(), reserva.getHoraFin()).toMinutes()) / 60d;
    }

    private double porcentaje(double valor, double total) { return redondear(Math.min(100d, total <= 0 ? 0 : valor * 100d / total)); }
    private double promedio(double valor, long cantidad) { return redondear(cantidad == 0 ? 0 : valor / cantidad); }
    private double variacion(double actual, double anterior) {
        if (anterior == 0) return actual == 0 ? 0 : 100;
        return redondear((actual - anterior) * 100d / anterior);
    }
    private double redondear(double valor) { return Math.round(valor * 10d) / 10d; }
    private String nivel(double porcentaje) { return porcentaje >= 70 ? "ALTO" : porcentaje >= 30 ? "MEDIO" : "BAJO"; }
    private String recomendacion(String nombre, String nivel, double horas) {
        if (horas == 0) {
            return nombre + ": sin actividad durante el período seleccionado.";
        }
        return switch (nivel) {
            case "ALTO" -> nombre + ": uso alto; conviene revisar su estado y considerar rotación o mantenimiento preventivo.";
            case "MEDIO" -> nombre + ": uso equilibrado durante el período seleccionado.";
            default -> nombre + ": uso bajo; puede promocionarse o utilizarse para distribuir mejor la demanda.";
        };
    }
    private double sumarMeses(Map<String, Double> datos, int desde, int hasta) {
        return redondear(datos.values().stream().skip(desde).limit(hasta - desde).mapToDouble(Double::doubleValue).sum());
    }
}
