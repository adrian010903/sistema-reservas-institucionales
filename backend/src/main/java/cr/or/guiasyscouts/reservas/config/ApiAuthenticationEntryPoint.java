package cr.or.guiasyscouts.reservas.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws IOException {
        escribir(response, 401, "No autenticado", "Debes iniciar sesión para acceder a este recurso", request.getRequestURI());
    }

    static void escribir(HttpServletResponse response, int status, String title, String detail, String instance) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/problem+json");
        response.getWriter().write("{\"title\":\"" + escapar(title) + "\",\"status\":" + status
                + ",\"detail\":\"" + escapar(detail) + "\",\"instance\":\"" + escapar(instance) + "\"}");
    }

    private static String escapar(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "").replace("\n", "\\n");
    }
}
