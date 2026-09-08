package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.ReporteResumenResponse;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Lugar;
import cr.or.guiasyscouts.reservas.model.Reserva;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.LugarRepository;
import cr.or.guiasyscouts.reservas.repository.ReservaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteAnaliticoServiceTest {
    @Mock ReservaRepository reservaRepository;
    @Mock EspacioRepository espacioRepository;
    @Mock LugarRepository lugarRepository;
    ReporteAnaliticoService service;

    @BeforeEach
    void setUp() {
        service = new ReporteAnaliticoService(reservaRepository, espacioRepository, lugarRepository);
    }

    @Test
    void calculaHorasOcupacionNivelesYExcluyeCanceladasDelUso() throws Exception {
        LocalDate fecha = LocalDate.of(2026, 7, 15);
        Lugar lugar = lugar(1L, "Campo Escuela");
        Espacio auditorio = espacio(10L, "Auditorio", lugar);
        Espacio cabana = espacio(11L, "Cabaña", lugar);
        Reserva confirmada = reserva(1L, fecha, LocalTime.of(8, 0), LocalTime.of(15, 0), EstadoReserva.CONFIRMADA, 30, auditorio);
        Reserva cancelada = reserva(2L, fecha, LocalTime.of(8, 0), LocalTime.of(12, 0), EstadoReserva.CANCELADA, 20, auditorio);
        when(reservaRepository.findAllByOrderByFechaDescHoraInicioDesc()).thenReturn(List.of(confirmada, cancelada));
        when(espacioRepository.findAll()).thenReturn(List.of(auditorio, cabana));
        when(lugarRepository.findAll()).thenReturn(List.of(lugar));

        ReporteResumenResponse resultado = service.resumen(fecha, fecha, null, null, null);

        assertThat(resultado.total()).isEqualTo(2);
        assertThat(resultado.totalHoras()).isEqualTo(7d);
        assertThat(resultado.totalPersonas()).isEqualTo(30);
        assertThat(resultado.porcentajeOcupacion()).isEqualTo(38.9d);
        assertThat(resultado.promedioPersonasPorReserva()).isEqualTo(30d);
        assertThat(resultado.porcentajeCancelacion()).isEqualTo(50d);
        assertThat(resultado.variacionReservas()).isZero();
        assertThat(resultado.variacionHoras()).isZero();
        assertThat(resultado.tienePeriodoAnterior()).isFalse();
        assertThat(resultado.porDiaSemana()).containsEntry("mié", 7d);
        assertThat(resultado.porHoraInicio()).containsEntry("08:00", 1L);
        assertThat(resultado.espaciosUso()).extracting(ReporteResumenResponse.UsoEspacio::nivelUso)
                .containsExactly("ALTO", "BAJO");
        assertThat(resultado.recomendaciones()).anyMatch(texto -> texto.contains("rotación"));
    }

    @Test
    void aplicaFiltrosDeLugarEspacioEstadoYPeriodo() throws Exception {
        LocalDate fecha = LocalDate.of(2026, 8, 10);
        Lugar lugar = lugar(1L, "Hostel");
        Espacio habitacion = espacio(5L, "Habitación 1", lugar);
        Reserva reserva = reserva(4L, fecha, LocalTime.of(9, 0), LocalTime.of(11, 0), EstadoReserva.APROBADA, 2, habitacion);
        when(reservaRepository.findAllByOrderByFechaDescHoraInicioDesc()).thenReturn(List.of(reserva));

        assertThat(service.filtrar(fecha, fecha, EstadoReserva.APROBADA, 1L, 5L)).containsExactly(reserva);
        assertThat(service.filtrar(fecha.plusDays(1), null, null, null, null)).isEmpty();
        assertThat(service.filtrar(null, null, EstadoReserva.RECHAZADA, null, null)).isEmpty();
    }

    @Test
    void indicaSinActividadCuandoElPeriodoNoTieneReservas() throws Exception {
        Lugar lugar = lugar(1L, "Hostel");
        Espacio habitacion = espacio(5L, "Habitación 1", lugar);
        when(reservaRepository.findAllByOrderByFechaDescHoraInicioDesc()).thenReturn(List.of());
        when(espacioRepository.findAll()).thenReturn(List.of(habitacion));
        when(lugarRepository.findAll()).thenReturn(List.of(lugar));

        ReporteResumenResponse resultado = service.resumen(
                LocalDate.of(2030, 1, 1), LocalDate.of(2030, 12, 31), null, null, null);

        assertThat(resultado.recomendaciones()).containsExactly(
                "Habitación 1: sin actividad durante el período seleccionado.");
    }

    private Lugar lugar(Long id, String nombre) throws Exception {
        Lugar lugar = new Lugar(); asignarId(lugar, id); lugar.setNombre(nombre); return lugar;
    }

    private Espacio espacio(Long id, String nombre, Lugar lugar) throws Exception {
        Espacio espacio = new Espacio(); asignarId(espacio, id); espacio.setNombre(nombre); espacio.setLugar(lugar); return espacio;
    }

    private Reserva reserva(Long id, LocalDate fecha, LocalTime inicio, LocalTime fin, EstadoReserva estado,
                            int personas, Espacio espacio) throws Exception {
        Reserva reserva = new Reserva(); asignarId(reserva, id); reserva.setFecha(fecha); reserva.setHoraInicio(inicio);
        reserva.setHoraFin(fin); reserva.setEstado(estado); reserva.setCantidadPersonas(personas); reserva.setEspacio(espacio);
        return reserva;
    }

    private void asignarId(Object target, Long id) throws Exception {
        Field field = target.getClass().getDeclaredField("id"); field.setAccessible(true); field.set(target, id);
    }
}
