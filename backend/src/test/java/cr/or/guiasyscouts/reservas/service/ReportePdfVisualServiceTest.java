package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.dto.ReporteResumenResponse;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.EstadoReserva;
import cr.or.guiasyscouts.reservas.model.Lugar;
import cr.or.guiasyscouts.reservas.model.Reserva;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ReportePdfVisualServiceTest {
    private final ReportePdfVisualService service = new ReportePdfVisualService();

    @Test
    void generaPdfValidoAunqueNoHayaReservas() throws Exception {
        LocalDate fecha = LocalDate.of(2026, 9, 7);
        ReporteResumenResponse resumen = new ReporteResumenResponse(
                0, 0, 0, 0, 0, 0, 0, 0, 0, false, fecha, fecha,
                Map.of("PENDIENTE", 0L), Map.of(), Map.of(), Map.of(),
                mesesVacios(), Map.of("Ene–Mar", 0d), Map.of(), Map.of(), List.of(), List.of(),
                List.of("Todavía no hay suficiente actividad para generar recomendaciones en este período."));

        byte[] pdf = service.generar(List.of(), fecha, fecha, null, "", resumen);

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF");
        assertThat(extraerTexto(pdf)).contains("0 reservas analizadas", "Horas reservadas por mes");
    }

    @Test
    void respetaLasSeccionesSeleccionadas() throws Exception {
        ReporteResumenResponse resumen = resumenConDatos();
        byte[] pdf = service.generar(List.of(), resumen.desde(), resumen.hasta(), null, "estados", resumen);
        String texto = extraerTexto(pdf);

        assertThat(texto).contains("Horas reservadas por mes", "Distribución por estado", "Estado de las reservas");
        assertThat(texto).doesNotContain("Uso detallado de espacios", "Horas por espacio", "Horas por lugar", "Detalle de reservas");
    }

    @Test
    void mantieneLaTablaEnVariasPaginasConMuchosRegistros() throws Exception {
        ReporteResumenResponse resumen = resumenConDatos();
        List<Reserva> reservas = new ArrayList<>();
        Lugar lugar = new Lugar(); lugar.setNombre("Campo Escuela");
        Espacio espacio = new Espacio(); espacio.setNombre("Auditorio principal"); espacio.setLugar(lugar);
        for (int i = 0; i < 180; i++) {
            Reserva r = new Reserva(); r.setFecha(LocalDate.of(2026, 9, 1).plusDays(i % 25));
            r.setHoraInicio(LocalTime.of(8, 0)); r.setHoraFin(LocalTime.of(10, 0));
            r.setEstado(EstadoReserva.CONFIRMADA); r.setCantidadPersonas(20); r.setEspacio(espacio); reservas.add(r);
        }

        byte[] pdf = service.generar(reservas, resumen.desde(), resumen.hasta(), null, "detalles", resumen);
        PdfReader reader = new PdfReader(pdf);
        assertThat(reader.getNumberOfPages()).isGreaterThan(4);
        assertThat(extraerTexto(pdf)).contains("Detalle de reservas", "Auditorio principal");
    }

    private ReporteResumenResponse resumenConDatos() {
        LocalDate desde = LocalDate.of(2026, 9, 1);
        LocalDate hasta = LocalDate.of(2026, 9, 30);
        Map<String, Double> meses = mesesVacios(); meses.put("sept", 20d);
        var espacio = new ReporteResumenResponse.UsoEspacio(1L, "Auditorio", "Campo Escuela", 10, 20, 7.4, "BAJO", "Auditorio: uso bajo.");
        var lugar = new ReporteResumenResponse.UsoLugar(1L, "Campo Escuela", 10, 20, 7.4, "BAJO");
        return new ReporteResumenResponse(10, 2, 200, 20, 7.4, 20, 10, 25, 15, true,
                desde, hasta, Map.of("CONFIRMADA", 10L), Map.of("Auditorio", 10L), Map.of("Campo Escuela", 10L), Map.of(),
                meses, Map.of("Jul–Sep", 20d), Map.of("lun", 20d), Map.of("08:00", 10L),
                List.of(espacio), List.of(lugar), List.of("Auditorio: uso bajo."));
    }

    private String extraerTexto(byte[] pdf) throws Exception {
        PdfReader reader = new PdfReader(pdf);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        StringBuilder texto = new StringBuilder();
        for (int pagina = 1; pagina <= reader.getNumberOfPages(); pagina++) {
            texto.append(extractor.getTextFromPage(pagina));
        }
        reader.close();
        return texto.toString();
    }

    private Map<String, Double> mesesVacios() {
        Map<String, Double> meses = new LinkedHashMap<>();
        for (String mes : List.of("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic")) meses.put(mes, 0d);
        return meses;
    }
}
