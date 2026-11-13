package cr.or.guiasyscouts.reservas.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import cr.or.guiasyscouts.reservas.service.DiagnosticoService;
import org.springframework.security.access.AccessDeniedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);
    private final DiagnosticoService diagnostico;

    public ApiExceptionHandler(DiagnosticoService diagnostico) {
        this.diagnostico = diagnostico;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail argumentosInvalidos(MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> errores = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                errores.putIfAbsent(error.getField(), error.getDefaultMessage()));
        String detalle = errores.values().stream().findFirst().orElse("Los datos enviados no son válidos");
        ProblemDetail problem = problema(HttpStatus.BAD_REQUEST, "Datos inválidos", detalle, request);
        problem.setProperty("errores", errores);
        return problem;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail restriccionInvalida(ConstraintViolationException exception, HttpServletRequest request) {
        String detalle = exception.getConstraintViolations().stream()
                .map(violation -> violation.getMessage()).findFirst().orElse("Los datos enviados no son válidos");
        return problema(HttpStatus.BAD_REQUEST, "Datos inválidos", detalle, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail cuerpoInvalido(HttpMessageNotReadableException exception, HttpServletRequest request) {
        return problema(HttpStatus.BAD_REQUEST, "Solicitud inválida",
                "El cuerpo de la solicitud está incompleto o contiene valores no reconocidos", request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail estadoRespuesta(ResponseStatusException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        if (status.is5xxServerError()) return errorInterno(exception, request);
        String detalle = exception.getReason() == null || exception.getReason().isBlank()
                ? "No fue posible completar la solicitud"
                : exception.getReason();
        return problema(status, titulo(status), detalle, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail accesoDenegado(AccessDeniedException exception, HttpServletRequest request) {
        return problema(HttpStatus.FORBIDDEN, "Acceso denegado",
                "No tienes permisos para realizar esta operación", request);
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    ProblemDetail rutaNoEncontrada(Exception exception, HttpServletRequest request) {
        return problema(HttpStatus.NOT_FOUND, "Recurso no encontrado",
                "La ruta solicitada no existe", request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ProblemDetail metodoNoPermitido(HttpRequestMethodNotSupportedException exception, HttpServletRequest request) {
        return problema(HttpStatus.METHOD_NOT_ALLOWED, "Método no permitido",
                "La operación no admite el método HTTP solicitado", request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ProblemDetail tipoContenidoNoSoportado(HttpMediaTypeNotSupportedException exception, HttpServletRequest request) {
        return problema(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Formato no soportado",
                "El formato enviado no está permitido para esta operación", request);
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    ProblemDetail formatoNoAceptable(HttpMediaTypeNotAcceptableException exception, HttpServletRequest request) {
        return problema(HttpStatus.NOT_ACCEPTABLE, "Formato no disponible",
                "El servidor no puede devolver un formato compatible con la solicitud", request);
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    ProblemDetail parametroInvalido(Exception exception, HttpServletRequest request) {
        return problema(HttpStatus.BAD_REQUEST, "Parámetro inválido",
                "Falta un parámetro requerido o su formato no es válido", request);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail errorNoControlado(Exception exception, HttpServletRequest request) {
        return errorInterno(exception, request);
    }

    private ProblemDetail errorInterno(Exception exception, HttpServletRequest request) {
        String correlationId;
        try {
            correlationId = diagnostico.registrarErrorApi(request.getMethod(), exception);
        } catch (RuntimeException diagnosticError) {
            correlationId = UUID.randomUUID().toString();
            LOGGER.error("No se pudo registrar el error interno. correlationId={}, tipo={}", correlationId,
                    diagnosticError.getClass().getSimpleName());
        }
        ProblemDetail problem = problema(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno",
                "No fue posible completar la solicitud. Comparte este identificador con administración: " + correlationId,
                request);
        // No devolver la ruta exacta: algunos flujos pueden transportar identificadores en el path.
        problem.setInstance(URI.create("/api/v1"));
        problem.setProperty("correlationId", correlationId);
        return problem;
    }

    private String titulo(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Solicitud inválida";
            case UNAUTHORIZED -> "No autenticado";
            case FORBIDDEN -> "Acceso denegado";
            case NOT_FOUND -> "Recurso no encontrado";
            case CONFLICT -> "Conflicto";
            default -> "Solicitud rechazada";
        };
    }

    private ProblemDetail problema(HttpStatus status, String titulo, String detalle, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detalle);
        problem.setTitle(titulo);
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
