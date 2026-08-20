package cr.or.guiasyscouts.reservas.config;

import cr.or.guiasyscouts.reservas.service.CustomUserDetailsService;
import cr.or.guiasyscouts.reservas.service.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    private final JwtService jwtService = mock(JwtService.class);
    private final CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);

    @AfterEach
    void limpiarContexto() { SecurityContextHolder.clearContext(); }

    @Test
    void autenticaTokenValidoDeUsuarioActivo() throws Exception {
        var details = User.withUsername("activo@ejemplo.cr").password("hash").roles("USUARIO").build();
        when(jwtService.extraerCorreo("token-valido")).thenReturn(details.getUsername());
        when(userDetailsService.loadUserByUsername(details.getUsername())).thenReturn(details);
        when(jwtService.esTokenValido("token-valido", details.getUsername(), 0)).thenReturn(true);

        ejecutar("token-valido");

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(details.getUsername(), SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void noAutenticaTokenAnteriorDeUsuarioDeshabilitado() throws Exception {
        var details = User.withUsername("bloqueado@ejemplo.cr").password("hash").roles("USUARIO").disabled(true).build();
        when(jwtService.extraerCorreo("token-anterior")).thenReturn(details.getUsername());
        when(userDetailsService.loadUserByUsername(details.getUsername())).thenReturn(details);

        ejecutar("token-anterior");

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtService, never()).esTokenValido(anyString(), anyString(), anyInt());
    }

    private void ejecutar(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));
    }
}
