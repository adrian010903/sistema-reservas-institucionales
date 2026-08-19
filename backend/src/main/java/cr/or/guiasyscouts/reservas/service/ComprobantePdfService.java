package cr.or.guiasyscouts.reservas.service;

import cr.or.guiasyscouts.reservas.model.EstadoPago;
import cr.or.guiasyscouts.reservas.model.Pago;
import cr.or.guiasyscouts.reservas.repository.PagoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ComprobantePdfService {
    private final PagoRepository pagoRepository;
    public ComprobantePdfService(PagoRepository pagoRepository) { this.pagoRepository = pagoRepository; }

    @Transactional(readOnly = true)
    public byte[] generar(String correo, Long pagoId) {
        Pago pago = pagoRepository.findById(pagoId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado"));
        if (!pago.getReserva().getUsuario().getCorreo().equalsIgnoreCase(correo))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El pago no pertenece al usuario");
        if (pago.getEstado() != EstadoPago.APROBADO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El comprobante solo está disponible para pagos aprobados");
        return construir(pago);
    }

    private byte[] construir(Pago pago) {
        var reserva = pago.getReserva();
        String fechaPago = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", new Locale("es", "CR"))
                .withZone(ZoneId.of("America/Costa_Rica")).format(pago.getCreadoEn());
        String contenido = "q\n0.16 0.18 0.48 rg\n45 735 505 70 re f\nQ\n1 1 1 rg\n" +
                texto(65, 775, 22, "Comprobante de pago") + texto(65, 752, 10, "Sistema de Reservas Institucionales") +
                "0.94 0.95 0.98 rg\n45 530 505 175 re f\n0.12 0.15 0.28 rg\n" +
                texto(65, 680, 12, "Referencia: " + pago.getReferencia()) +
                texto(65, 653, 11, "Fecha de pago: " + fechaPago) +
                texto(65, 626, 11, "Reserva: #" + reserva.getId()) +
                texto(65, 599, 11, "Lugar: " + (reserva.getEspacio().getLugar() == null ? "Sin lugar" : reserva.getEspacio().getLugar().getNombre())) +
                texto(65, 572, 11, "Espacio: " + reserva.getEspacio().getNombre()) +
                texto(65, 545, 11, "Fecha y horario: " + reserva.getFecha() + "  " + reserva.getHoraInicio() + " - " + reserva.getHoraFin()) +
                texto(65, 485, 13, "Método: " + pago.getMetodo().name().replace('_', ' ')) +
                texto(65, 452, 13, "Estado: APROBADO") +
                texto(65, 400, 20, "Total: CRC " + pago.getMonto().toPlainString()) +
                texto(65, 335, 10, "Usuario: " + reserva.getUsuario().getNombre() + " - " + reserva.getUsuario().getCorreo()) +
                texto(65, 95, 9, "Documento generado electrónicamente. Conserve la referencia para cualquier consulta.");
        return pdf(contenido);
    }

    private String texto(int x, int y, int size, String value) {
        return "BT /F1 " + size + " Tf " + x + " " + y + " Td (" + escapar(value) + ") Tj ET\n";
    }

    private String escapar(String value) { return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)"); }

    private byte[] pdf(String contenido) {
        byte[] stream = contenido.getBytes(StandardCharsets.ISO_8859_1);
        List<byte[]> objetos = List.of(
                "<< /Type /Catalog /Pages 2 0 R >>".getBytes(StandardCharsets.ISO_8859_1),
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>".getBytes(StandardCharsets.ISO_8859_1),
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>".getBytes(StandardCharsets.ISO_8859_1),
                unir(("<< /Length " + stream.length + " >>\nstream\n").getBytes(StandardCharsets.ISO_8859_1), stream, "\nendstream".getBytes(StandardCharsets.ISO_8859_1)),
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>".getBytes(StandardCharsets.ISO_8859_1)
        );
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream(); out.write("%PDF-1.4\n%âãÏÓ\n".getBytes(StandardCharsets.ISO_8859_1));
            List<Integer> offsets = new ArrayList<>();
            for (int i = 0; i < objetos.size(); i++) { offsets.add(out.size()); out.write(((i + 1) + " 0 obj\n").getBytes(StandardCharsets.ISO_8859_1)); out.write(objetos.get(i)); out.write("\nendobj\n".getBytes(StandardCharsets.ISO_8859_1)); }
            int xref = out.size(); out.write(("xref\n0 " + (objetos.size() + 1) + "\n0000000000 65535 f \n").getBytes(StandardCharsets.ISO_8859_1));
            for (int offset : offsets) out.write(String.format("%010d 00000 n \n", offset).getBytes(StandardCharsets.ISO_8859_1));
            out.write(("trailer\n<< /Size " + (objetos.size() + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF").getBytes(StandardCharsets.ISO_8859_1)); return out.toByteArray();
        } catch (IOException ex) { throw new IllegalStateException("No se pudo generar el comprobante", ex); }
    }

    private byte[] unir(byte[]... partes) { try { ByteArrayOutputStream out = new ByteArrayOutputStream(); for (byte[] parte : partes) out.write(parte); return out.toByteArray(); } catch (IOException ex) { throw new IllegalStateException(ex); } }
}
