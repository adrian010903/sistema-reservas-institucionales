package cr.or.guiasyscouts.reservas.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
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
        String detalle = exception.getReason() == null || exception.getReason().isBlank()
                ? "No fue posible completar la solicitud"
                : exception.getReason();
        return problema(status, titulo(status), detalle, request);
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
