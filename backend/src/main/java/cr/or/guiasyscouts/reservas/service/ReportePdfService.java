package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.Reserva;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportePdfService {
    private static final int FILAS_POR_PAGINA = 25;

    public byte[] generar(List<Reserva> reservas, LocalDate desde, LocalDate hasta, String estado) {
        int paginas = Math.max(1, (int) Math.ceil(reservas.size() / (double) FILAS_POR_PAGINA));
        List<String> contenidos = new ArrayList<>();
        for (int pagina = 0; pagina < paginas; pagina++) {
            int inicio = pagina * FILAS_POR_PAGINA;
            int fin = Math.min(inicio + FILAS_POR_PAGINA, reservas.size());
            contenidos.add(contenidoPagina(reservas.subList(inicio, fin), pagina + 1, paginas, reservas.size(), desde, hasta, estado));
        }
        return construirPdf(contenidos);
    }

    private String contenidoPagina(List<Reserva> reservas, int pagina, int paginas, int total,
                                   LocalDate desde, LocalDate hasta, String estado) {
        StringBuilder out = new StringBuilder("q\n0.16 0.18 0.48 rg\n35 770 525 48 re f\nQ\n1 1 1 rg\n")
                .append(texto(50, 791, 18, "Reporte de reservas institucionales"))
                .append("0.12 0.15 0.28 rg\n")
                .append(texto(45, 746, 9, "Generado: " + LocalDate.now() + "   Total: " + total
                        + "   Periodo: " + valor(desde) + " a " + valor(hasta) + "   Estado: " + (estado == null ? "TODOS" : estado)))
                .append("0.12 0.15 0.28 rg\n");
        int y = 696;
        if (pagina == 1) {
            out.append(texto(43, 700, 11, "Resumen visual"));
            int max = Math.max(1, reservas.size());
            int chartY = 678;
            for (String estadoGrafico : new String[]{"PENDIENTE", "APROBADA", "CONFIRMADA", "CANCELADA", "RECHAZADA"}) {
                long count = reservas.stream().filter(r -> r.getEstado() != null && estadoGrafico.equals(r.getEstado().name())).count();
                int width = (int) Math.round(210d * count / max);
                out.append(texto(43, chartY + 3, 7, estadoGrafico));
                out.append("0.91 0.92 0.96 rg\n105 ").append(chartY).append(" 210 10 re f\n");
                out.append("0.17 0.07 0.38 rg\n105 ").append(chartY).append(" ").append(width).append(" 10 re f\n");
                out.append(texto(322, chartY + 3, 8, String.valueOf(count)));
                chartY -= 14;
            }
            out.append("0.92 0.94 0.98 rg\n35 575 525 22 re f\n0.12 0.15 0.28 rg\n")
                    .append(texto(43, 583, 9, "ID   FECHA       HORARIO       ESTADO       PERSONAS   ESPACIO / USUARIO"));
            y = 556;
        }
        if (pagina > 1) {
            out.append("0.92 0.94 0.98 rg\n35 715 525 22 re f\n0.12 0.15 0.28 rg\n")
                    .append(texto(43, 723, 9, "ID   FECHA       HORARIO       ESTADO       PERSONAS   ESPACIO / USUARIO"));
        }
        for (Reserva reserva : reservas) {
            String linea = String.format("#%-4s %-10s %s-%s  %-11s  %-3s  %s / %s",
                    reserva.getId(), reserva.getFecha(), reserva.getHoraInicio(), reserva.getHoraFin(),
                    reserva.getEstado(), reserva.getCantidadPersonas(),
                    reserva.getEspacio() == null ? "Sin espacio" : reserva.getEspacio().getNombre(),
                    reserva.getUsuario() == null ? "Sin usuario" : reserva.getUsuario().getCorreo());
            out.append(texto(43, y, 8, limitar(linea, 112)));
            out.append("0.86 0.88 0.93 RG\n43 ").append(y - 7).append(" m 550 ").append(y - 7).append(" l S\n");
            y -= 25;
        }
        if (reservas.isEmpty()) out.append(texto(43, 680, 11, "No hay reservas para los filtros seleccionados."));
        out.append(texto(45, 35, 8, "Guías y Scouts de Costa Rica - Página " + pagina + " de " + paginas));
        return out.toString();
    }

    private String valor(LocalDate fecha) { return fecha == null ? "sin límite" : fecha.toString(); }
    private String limitar(String value, int max) { return value.length() <= max ? value : value.substring(0, max - 3) + "..."; }
    private String texto(int x, int y, int size, String value) {
        return "BT /F1 " + size + " Tf " + x + " " + y + " Td (" + escapar(value) + ") Tj ET\n";
    }
    private String escapar(String value) { return String.valueOf(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)"); }


    private byte[] construirPdf(List<String> paginas) {
        int fontId = 3 + paginas.size() * 2;
        StringBuilder kids = new StringBuilder();
        for (int i = 0; i < paginas.size(); i++) kids.append(3 + i * 2).append(" 0 R ");
        List<byte[]> objetos = new ArrayList<>();
        objetos.add("<< /Type /Catalog /Pages 2 0 R >>".getBytes(StandardCharsets.ISO_8859_1));
        objetos.add(("<< /Type /Pages /Kids [" + kids + "] /Count " + paginas.size() + " >>").getBytes(StandardCharsets.ISO_8859_1));
        for (int i = 0; i < paginas.size(); i++) {
            int contentId = 4 + i * 2;
            objetos.add(("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 "
                    + fontId + " 0 R >> >> /Contents " + contentId + " 0 R >>").getBytes(StandardCharsets.ISO_8859_1));
            byte[] stream = paginas.get(i).getBytes(StandardCharsets.ISO_8859_1);
            objetos.add(unir(("<< /Length " + stream.length + " >>\nstream\n").getBytes(StandardCharsets.ISO_8859_1),
                    stream, "\nendstream".getBytes(StandardCharsets.ISO_8859_1)));
        }
        objetos.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>".getBytes(StandardCharsets.ISO_8859_1));
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            out.write("%PDF-1.4\n%âãÏÓ\n".getBytes(StandardCharsets.ISO_8859_1));
            List<Integer> offsets = new ArrayList<>();
            for (int i = 0; i < objetos.size(); i++) {
                offsets.add(out.size()); out.write(((i + 1) + " 0 obj\n").getBytes(StandardCharsets.ISO_8859_1));
                out.write(objetos.get(i)); out.write("\nendobj\n".getBytes(StandardCharsets.ISO_8859_1));
            }
            int xref = out.size();
            out.write(("xref\n0 " + (objetos.size() + 1) + "\n0000000000 65535 f \n").getBytes(StandardCharsets.ISO_8859_1));
            for (int offset : offsets) out.write(String.format("%010d 00000 n \n", offset).getBytes(StandardCharsets.ISO_8859_1));
            out.write(("trailer\n<< /Size " + (objetos.size() + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF").getBytes(StandardCharsets.ISO_8859_1));
            return out.toByteArray();
        } catch (IOException exception) { throw new IllegalStateException("No se pudo generar el reporte PDF", exception); }
    }

    private byte[] unir(byte[]... partes) {
        try { ByteArrayOutputStream out = new ByteArrayOutputStream(); for (byte[] parte : partes) out.write(parte); return out.toByteArray(); }
        catch (IOException exception) { throw new IllegalStateException(exception); }
    }
}
