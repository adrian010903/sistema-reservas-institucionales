package cr.or.guiasyscouts.reservas.service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.*;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.axis.CategoryAxis;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.stereotype.Service;
import cr.or.guiasyscouts.reservas.model.Reserva;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import javax.imageio.ImageIO;

@Service
public class ReportePdfVisualService {
    public byte[] generar(List<Reserva> reservas, LocalDate desde, LocalDate hasta, String estado, String secciones) {
        try {
            Set<String> seleccion = secciones == null || secciones.isBlank() ? Set.of("lugares", "espacios", "detalles", "estados") : Set.of(secciones.split(","));
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 32, 32, 34, 34);
            PdfWriter.getInstance(doc, out); doc.open();
            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(44,18,97));
            Font h2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(44,18,97));
            Font small = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(85,90,115));
            doc.add(new Paragraph("Reporte ejecutivo de reservas", title));
            doc.add(new Paragraph("Guías y Scouts de Costa Rica · " + LocalDate.now(), small));
            doc.add(new Paragraph("Período: " + (desde == null ? "sin límite" : desde) + " a " + (hasta == null ? "sin límite" : hasta) + " · Estado: " + (estado == null ? "TODOS" : estado), small));
            doc.add(Chunk.NEWLINE);
            PdfPTable metrics = new PdfPTable(3); metrics.setWidthPercentage(100);
            metric(metrics, "RESERVAS", String.valueOf(reservas.size()));
            metric(metrics, "PERSONAS", String.valueOf(reservas.stream().mapToInt(r -> r.getCantidadPersonas() == null ? 0 : r.getCantidadPersonas()).sum()));
            metric(metrics, "ESPACIOS USADOS", String.valueOf(reservas.stream().filter(r -> r.getEspacio() != null).map(r -> r.getEspacio().getNombre()).distinct().count()));
            doc.add(metrics); doc.add(Chunk.NEWLINE);
            PdfPTable charts = new PdfPTable(1); charts.setWidthPercentage(100); int chartCount = 0;
            if (seleccion.contains("espacios")) { charts.addCell(chart(bars(reservas), "Espacios más utilizados")); chartCount++; }
            if (seleccion.contains("lugares")) { charts.addCell(chart(placeBars(reservas), "Lugares / oficinas con más reservas")); chartCount++; }
            if (seleccion.contains("estados")) { charts.addCell(chart(pie(reservas), "Estado de las reservas")); chartCount++; }
            if (chartCount > 0) { doc.add(charts); doc.add(Chunk.NEWLINE); }
            if (seleccion.contains("detalles")) doc.add(new Paragraph("Detalle de reservas", h2));
            PdfPTable table = new PdfPTable(new float[]{.5f,1.1f,1.25f,1f,1.8f,1.8f}); table.setWidthPercentage(100);
            for (String x : new String[]{"ID","Fecha","Horario","Estado","Espacio","Usuario"}) header(table,x);
            for (Reserva r : reservas) { cell(table,"#"+r.getId()); cell(table,String.valueOf(r.getFecha())); cell(table,String.valueOf(r.getHoraInicio())+" - "+r.getHoraFin()); cell(table,String.valueOf(r.getEstado())); cell(table,r.getEspacio()==null?"Sin espacio":r.getEspacio().getNombre()); cell(table,r.getUsuario()==null?"Sin usuario":r.getUsuario().getCorreo()); }
            if (seleccion.contains("detalles")) doc.add(table); doc.close(); return out.toByteArray();
        } catch (Exception e) { throw new IllegalStateException("No se pudo generar el reporte PDF visual", e); }
    }
    private void metric(PdfPTable t,String label,String value){PdfPCell c=new PdfPCell();c.setPadding(9);c.setBackgroundColor(new Color(247,244,251));c.addElement(new Paragraph(label,FontFactory.getFont(FontFactory.HELVETICA_BOLD,8,new Color(90,96,120))));c.addElement(new Paragraph(value,FontFactory.getFont(FontFactory.HELVETICA_BOLD,18,new Color(44,18,97))));t.addCell(c);}
    private PdfPCell chart(JFreeChart chart,String title)throws Exception{PdfPCell c=new PdfPCell();c.setPadding(9);c.setBorderColor(new Color(220,214,234));c.addElement(new Paragraph(title,FontFactory.getFont(FontFactory.HELVETICA_BOLD,12,new Color(44,18,97))));ByteArrayOutputStream b=new ByteArrayOutputStream();ImageIO.write(chart.createBufferedImage(720,310),"png",b);Image i=Image.getInstance(b.toByteArray());i.scaleToFit(500,230);c.addElement(i);return c;}
    private JFreeChart pie(List<Reserva> rs){DefaultPieDataset<String>d=new DefaultPieDataset<>();rs.stream().filter(r->r.getEstado()!=null).collect(Collectors.groupingBy(r->r.getEstado().name(),Collectors.counting())).forEach(d::setValue);JFreeChart c=ChartFactory.createPieChart(null,d,true,false,false);((PiePlot<?>)c.getPlot()).setOutlineVisible(false);return c;}
    private JFreeChart bars(List<Reserva> rs){DefaultCategoryDataset d=new DefaultCategoryDataset();rs.stream().filter(r->r.getEspacio()!=null).collect(Collectors.groupingBy(r->r.getEspacio().getNombre(),Collectors.counting())).entrySet().stream().sorted(Map.Entry.<String,Long>comparingByValue().reversed()).limit(6).forEach(e->d.addValue(e.getValue(),"Reservas",e.getKey()));JFreeChart c=ChartFactory.createBarChart(null,"Reservas","Espacio",d, PlotOrientation.HORIZONTAL, true, false, false);CategoryPlot p=c.getCategoryPlot();p.setOutlineVisible(false);CategoryAxis axis=p.getDomainAxis();axis.setMaximumCategoryLabelLines(2);axis.setMaximumCategoryLabelWidthRatio(1.0f);((BarRenderer)p.getRenderer()).setSeriesPaint(0,new Color(44,18,97));return c;}
    private JFreeChart placeBars(List<Reserva> rs){DefaultCategoryDataset d=new DefaultCategoryDataset();rs.stream().filter(r->r.getEspacio()!=null).collect(Collectors.groupingBy(r->r.getEspacio().getLugar()==null?"Sin lugar":r.getEspacio().getLugar().getNombre(),Collectors.counting())).entrySet().stream().sorted(Map.Entry.<String,Long>comparingByValue().reversed()).forEach(e->d.addValue(e.getValue(),"Reservas",e.getKey()));JFreeChart c=ChartFactory.createBarChart(null,"Lugar / oficina","Reservas",d);CategoryPlot p=c.getCategoryPlot();p.setOutlineVisible(false);CategoryAxis axis=p.getDomainAxis();axis.setMaximumCategoryLabelLines(3);axis.setMaximumCategoryLabelWidthRatio(1.0f);((BarRenderer)p.getRenderer()).setSeriesPaint(0,new Color(0,176,198));return c;}
    private void header(PdfPTable t,String s){PdfPCell c=new PdfPCell(new Phrase(s,FontFactory.getFont(FontFactory.HELVETICA_BOLD,8,Color.WHITE)));c.setBackgroundColor(new Color(44,18,97));c.setPadding(6);t.addCell(c);}
    private void cell(PdfPTable t,String s){PdfPCell c=new PdfPCell(new Phrase(s,FontFactory.getFont(FontFactory.HELVETICA,7,new Color(45,48,75))));c.setPadding(5);c.setBorderColor(new Color(225,227,235));t.addCell(c);}
}
