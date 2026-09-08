package cr.or.guiasyscouts.reservas.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import cr.or.guiasyscouts.reservas.dto.ReporteResumenResponse;
import cr.or.guiasyscouts.reservas.model.Reserva;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.CategoryAxis;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

@Service
public class ReportePdfVisualService {
    private static final Color MORADO = new Color(44, 18, 97);
    private static final Color ROJO = new Color(237, 26, 57);
    private static final Color CELESTE = new Color(0, 176, 198);
    private static final Color GRIS = new Color(85, 90, 115);
    private static final Color FONDO = new Color(247, 244, 251);
    private static final Font TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 23, MORADO);
    private static final Font SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, MORADO);
    private static final Font TEXTO = FontFactory.getFont(FontFactory.HELVETICA, 8, GRIS);

    public byte[] generar(List<Reserva> reservas, LocalDate desde, LocalDate hasta, String estado, String secciones,
                          ReporteResumenResponse resumen) {
        try {
            Set<String> seleccion = secciones == null ? Set.of("lugares", "espacios", "detalles", "estados")
                    : secciones.isBlank() ? Set.of() : Set.of(secciones.split(","));
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 34, 34, 44, 42);
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            writer.setPageEvent(new PieDePagina());
            doc.open();

            agregarEncabezado(doc);
            doc.add(new Paragraph("Reporte de uso de espacios", TITULO));
            doc.add(new Paragraph("Información para apoyar decisiones de ocupación, rotación y mantenimiento.", TEXTO));
            doc.add(Chunk.NEWLINE);
            agregarFiltros(doc, desde, hasta, estado, resumen);
            agregarMetricas(doc, resumen);

            if (seleccion.contains("espacios") || seleccion.contains("lugares")) {
                titulo(doc, "Uso de instalaciones");
                if (seleccion.contains("espacios")) agregarGraficoCompleto(doc, barrasEspacios(resumen), "Horas por espacio");
                if (seleccion.contains("lugares")) agregarGraficoCompleto(doc, barrasLugares(resumen), "Horas por lugar");
                doc.add(Chunk.NEWLINE);
            }

            titulo(doc, "Demanda a lo largo del año");
            agregarGraficoCompleto(doc, graficoMeses(resumen), "Horas reservadas por mes");
            doc.add(Chunk.NEWLINE);
            if (seleccion.contains("espacios")) agregarTablaUso(doc, resumen);
            agregarRecomendaciones(doc, resumen);
            if (seleccion.contains("estados")) agregarEstados(doc, resumen);
            if (seleccion.contains("detalles")) agregarDetalle(doc, reservas);
            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el reporte PDF visual", e);
        }
    }

    private void agregarEncabezado(Document doc) throws DocumentException {
        PdfPTable header = new PdfPTable(new float[]{2.1f, 1f}); header.setWidthPercentage(100);
        PdfPCell marca = new PdfPCell(); marca.setBorder(Rectangle.NO_BORDER);
        marca.addElement(new Paragraph("GUÍAS Y SCOUTS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, MORADO)));
        marca.addElement(new Paragraph("DE COSTA RICA", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, ROJO)));
        header.addCell(marca);
        PdfPCell fecha = new PdfPCell(new Phrase("Generado: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), TEXTO));
        fecha.setHorizontalAlignment(Element.ALIGN_RIGHT); fecha.setVerticalAlignment(Element.ALIGN_MIDDLE); fecha.setBorder(Rectangle.NO_BORDER);
        header.addCell(fecha); doc.add(header);
        doc.add(new Paragraph("________________________________________________________________________________", FontFactory.getFont(FontFactory.HELVETICA, 7, CELESTE)));
    }

    private void agregarFiltros(Document doc, LocalDate desde, LocalDate hasta, String estado,
                                ReporteResumenResponse r) throws DocumentException {
        PdfPTable filtros = new PdfPTable(3); filtros.setWidthPercentage(100);
        filtro(filtros, "PERÍODO", fecha(desde == null ? r.desde() : desde) + " — " + fecha(hasta == null ? r.hasta() : hasta));
        filtro(filtros, "ESTADO", estado == null || estado.isBlank() ? "Todos" : estado);
        filtro(filtros, "ALCANCE", r.total() + " reservas analizadas");
        doc.add(filtros); doc.add(Chunk.NEWLINE);
    }

    private void agregarMetricas(Document doc, ReporteResumenResponse r) throws DocumentException {
        PdfPTable t = new PdfPTable(3); t.setWidthPercentage(100);
        metric(t, "RESERVAS", String.valueOf(r.total()), variacion(r.variacionReservas(), r.tienePeriodoAnterior()));
        metric(t, "HORAS", r.totalHoras() + " h", variacion(r.variacionHoras(), r.tienePeriodoAnterior()));
        metric(t, "OCUPACIÓN", r.porcentajeOcupacion() + "%", "capacidad estimada");
        metric(t, "PERSONAS", String.valueOf(r.totalPersonas()), r.promedioPersonasPorReserva() + " por reserva");
        metric(t, "PRÓXIMAS", String.valueOf(r.proximas()), "reservas vigentes");
        metric(t, "CANCELACIÓN", r.porcentajeCancelacion() + "%", "del período");
        doc.add(t); doc.add(Chunk.NEWLINE);
    }

    private void agregarTablaUso(Document doc, ReporteResumenResponse r) throws DocumentException {
        titulo(doc, "Uso detallado de espacios");
        PdfPTable t = new PdfPTable(new float[]{2.4f, 1.5f, .7f, .7f, .9f, .8f}); t.setWidthPercentage(100);
        for (String x : new String[]{"Espacio", "Lugar", "Reservas", "Horas", "Ocupación", "Nivel"}) header(t, x);
        for (ReporteResumenResponse.UsoEspacio e : r.espaciosUso()) {
            cell(t, e.nombre()); cell(t, e.lugar()); cell(t, String.valueOf(e.reservas())); cell(t, e.horas() + " h");
            cell(t, e.porcentajeOcupacion() + "%"); nivel(t, e.nivelUso());
        }
        t.setHeaderRows(1); doc.add(t); doc.add(Chunk.NEWLINE);
    }

    private void agregarRecomendaciones(Document doc, ReporteResumenResponse r) throws DocumentException {
        titulo(doc, "Recomendaciones para decisiones");
        for (String texto : r.recomendaciones()) {
            PdfPTable box = new PdfPTable(1); box.setWidthPercentage(100); box.setSpacingAfter(5);
            PdfPCell c = new PdfPCell(new Phrase("• " + texto, FontFactory.getFont(FontFactory.HELVETICA, 9, MORADO)));
            c.setPadding(8); c.setBackgroundColor(new Color(241, 248, 250)); c.setBorderColor(CELESTE); box.addCell(c); doc.add(box);
        }
        doc.add(Chunk.NEWLINE);
    }

    private void agregarEstados(Document doc, ReporteResumenResponse r) throws Exception {
        titulo(doc, "Distribución por estado"); agregarGraficoCompleto(doc, graficoEstados(r), "Estado de las reservas"); doc.add(Chunk.NEWLINE);
    }

    private void agregarDetalle(Document doc, List<Reserva> reservas) throws DocumentException {
        titulo(doc, "Detalle de reservas");
        PdfPTable t = new PdfPTable(new float[]{.5f, 1f, 1.2f, 1f, 1.7f, 1.7f}); t.setWidthPercentage(100);
        for (String x : new String[]{"ID", "Fecha", "Horario", "Estado", "Espacio", "Usuario"}) header(t, x);
        for (Reserva r : reservas) {
            cell(t, "#" + r.getId()); cell(t, fecha(r.getFecha())); cell(t, r.getHoraInicio() + " - " + r.getHoraFin());
            cell(t, String.valueOf(r.getEstado())); cell(t, r.getEspacio() == null ? "Sin espacio" : r.getEspacio().getNombre());
            cell(t, r.getUsuario() == null ? "Sin usuario" : r.getUsuario().getCorreo());
        }
        t.setHeaderRows(1); doc.add(t);
    }

    private JFreeChart barrasEspacios(ReporteResumenResponse r) {
        DefaultCategoryDataset d = new DefaultCategoryDataset();
        r.espaciosUso().stream().limit(6).forEach(e -> d.addValue(e.horas(), "Horas", e.nombre()));
        return barras(d, "Horas", "Espacio", PlotOrientation.HORIZONTAL, MORADO);
    }
    private JFreeChart barrasLugares(ReporteResumenResponse r) {
        DefaultCategoryDataset d = new DefaultCategoryDataset(); r.lugaresUso().forEach(e -> d.addValue(e.horas(), "Horas", e.nombre()));
        return barras(d, "Lugar", "Horas", PlotOrientation.VERTICAL, CELESTE);
    }
    private JFreeChart graficoMeses(ReporteResumenResponse r) {
        DefaultCategoryDataset d = new DefaultCategoryDataset(); r.porMes().forEach((mes, horas) -> d.addValue(horas, "Horas", mes));
        return barras(d, "Mes", "Horas", PlotOrientation.VERTICAL, ROJO);
    }
    private JFreeChart graficoEstados(ReporteResumenResponse r) {
        DefaultPieDataset<String> d = new DefaultPieDataset<>(); r.porEstado().forEach((e, n) -> { if (n > 0) d.setValue(e, n); });
        JFreeChart c = ChartFactory.createPieChart(null, d, true, false, false); PiePlot<?> p = (PiePlot<?>) c.getPlot();
        p.setOutlineVisible(false); p.setBackgroundPaint(Color.WHITE);
        p.setLabelFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 15));
        if (c.getLegend() != null) c.getLegend().setItemFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 15));
        return c;
    }
    private JFreeChart barras(DefaultCategoryDataset d, String x, String y, PlotOrientation o, Color color) {
        JFreeChart c = ChartFactory.createBarChart(null, x, y, d, o, false, false, false); CategoryPlot p = c.getCategoryPlot();
        p.setOutlineVisible(false); p.setBackgroundPaint(Color.WHITE); p.setRangeGridlinePaint(new Color(225, 227, 235));
        ((BarRenderer) p.getRenderer()).setSeriesPaint(0, color); CategoryAxis axis = p.getDomainAxis();
        java.awt.Font fuenteGrafico = new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 15);
        axis.setTickLabelFont(fuenteGrafico); axis.setLabelFont(fuenteGrafico);
        p.getRangeAxis().setTickLabelFont(fuenteGrafico); p.getRangeAxis().setLabelFont(fuenteGrafico);
        axis.setMaximumCategoryLabelLines(2); axis.setMaximumCategoryLabelWidthRatio(1f); return c;
    }

    private void agregarGraficoCompleto(Document doc, JFreeChart chart, String title) throws Exception {
        PdfPTable tabla = new PdfPTable(1); tabla.setWidthPercentage(100); tabla.addCell(chart(chart, title, 500)); doc.add(tabla);
    }
    private PdfPCell chart(JFreeChart chart, String title, float ancho) throws Exception {
        PdfPCell c = new PdfPCell(); c.setPadding(8); c.setBorderColor(new Color(220, 214, 234)); c.addElement(new Paragraph(title, SUBTITULO));
        ByteArrayOutputStream b = new ByteArrayOutputStream(); ImageIO.write(chart.createBufferedImage(780, 310), "png", b);
        Image i = Image.getInstance(b.toByteArray()); i.scaleToFit(ancho, 205); c.addElement(i); return c;
    }
    private void titulo(Document d, String s) throws DocumentException { Paragraph p = new Paragraph(s, SUBTITULO); p.setSpacingBefore(4); p.setSpacingAfter(8); d.add(p); }
    private void filtro(PdfPTable t, String l, String v) { PdfPCell c = new PdfPCell(); c.setPadding(7); c.setBackgroundColor(FONDO); c.setBorderColor(new Color(225, 220, 235)); c.addElement(new Paragraph(l, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, GRIS))); c.addElement(new Paragraph(v, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, MORADO))); t.addCell(c); }
    private void metric(PdfPTable t, String l, String v, String n) { PdfPCell c = new PdfPCell(); c.setPadding(10); c.setBackgroundColor(FONDO); c.setBorderColor(Color.WHITE); c.addElement(new Paragraph(l, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, GRIS))); c.addElement(new Paragraph(v, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, MORADO))); c.addElement(new Paragraph(n, FontFactory.getFont(FontFactory.HELVETICA, 7, CELESTE))); t.addCell(c); }
    private void header(PdfPTable t, String s) { PdfPCell c = new PdfPCell(new Phrase(s, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, Color.WHITE))); c.setBackgroundColor(MORADO); c.setPadding(6); t.addCell(c); }
    private void cell(PdfPTable t, String s) { PdfPCell c = new PdfPCell(new Phrase(s, FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(45, 48, 75)))); c.setPadding(5); c.setBorderColor(new Color(225, 227, 235)); t.addCell(c); }
    private void nivel(PdfPTable t, String s) { Color color = "ALTO".equals(s) ? ROJO : "MEDIO".equals(s) ? new Color(210, 145, 0) : CELESTE; PdfPCell c = new PdfPCell(new Phrase(s, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, Color.WHITE))); c.setHorizontalAlignment(Element.ALIGN_CENTER); c.setVerticalAlignment(Element.ALIGN_MIDDLE); c.setPadding(5); c.setBackgroundColor(color); t.addCell(c); }
    private String fecha(LocalDate v) { return v == null ? "Sin límite" : v.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")); }
    private String variacion(double v, boolean tienePeriodoAnterior) {
        if (!tienePeriodoAnterior) return "sin datos anteriores para comparar";
        return v == 0 ? "sin cambio vs. período anterior" : (v > 0 ? "+" : "") + v + "% vs. período anterior";
    }

    private static class PieDePagina extends PdfPageEventHelper {
        @Override public void onEndPage(PdfWriter writer, Document document) {
            Phrase p = new Phrase("Guías y Scouts de Costa Rica  ·  Página " + writer.getPageNumber(), TEXTO);
            ColumnText.showTextAligned(writer.getDirectContent(), Element.ALIGN_CENTER, p,
                    (document.right() + document.left()) / 2, document.bottom() - 18, 0);
        }
    }
}
