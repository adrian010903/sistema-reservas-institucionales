package cr.or.guiasyscouts.reservas.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class ApiAccessDeniedHandler implements AccessDeniedHandler {
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws IOException {
        ApiAuthenticationEntryPoint.escribir(response, 403, "Acceso denegado",
                "No tienes permisos para realizar esta operación", request.getRequestURI());
    }
}
