package cr.or.guiasyscouts.reservas.controller;

import com.jayway.jsonpath.JsonPath;
import cr.or.guiasyscouts.reservas.model.CategoriaEspacio;
import cr.or.guiasyscouts.reservas.model.Espacio;
import cr.or.guiasyscouts.reservas.model.Lugar;
import cr.or.guiasyscouts.reservas.model.TipoEspacio;
import cr.or.guiasyscouts.reservas.repository.CategoriaEspacioRepository;
import cr.or.guiasyscouts.reservas.repository.EspacioRepository;
import cr.or.guiasyscouts.reservas.repository.LugarRepository;
import cr.or.guiasyscouts.reservas.repository.TipoEspacioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReservaPagoHttpIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private LugarRepository lugares;
    @Autowired private TipoEspacioRepository tipos;
    @Autowired private CategoriaEspacioRepository categorias;
    @Autowired private EspacioRepository espacios;

    @Test
    void catalogoPublicoIncluyeRelacionesDelEspacioSinAutenticacion() throws Exception {
        Espacio espacio = crearEspacio();

        mockMvc.perform(get("/api/v1/espacios"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[?(@.id == %d)].lugarId".formatted(espacio.getId()))
                        .value(org.hamcrest.Matchers.contains(espacio.getLugar().getId().intValue())))
                .andExpect(jsonPath("$[?(@.id == %d)].tipo".formatted(espacio.getId()))
                        .value(org.hamcrest.Matchers.contains(espacio.getTipo().getNombre())))
                .andExpect(jsonPath("$[?(@.id == %d)].categoria".formatted(espacio.getId()))
                        .value(org.hamcrest.Matchers.contains(espacio.getCategoria().getNombre())));
    }

    @Test
    void tarjetaSimuladaConfirmaReservaYRegistraPagoEnColones() throws Exception {
        Espacio espacio = crearEspacio();
        String token = registrarEIniciarSesion("pago");
        LocalDate fecha = LocalDate.now().plusDays(60);
        long reservaId = crearReserva(token, espacio.getId(), fecha, "09:00", "11:00");

        mockMvc.perform(post("/api/v1/pagos/mock")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservaId\":%d,\"metodo\":\"TARJETA_MOCK\"}".formatted(reservaId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reservaId").value(reservaId))
                .andExpect(jsonPath("$.monto").value(50000.00))
                .andExpect(jsonPath("$.moneda").value("CRC"))
                .andExpect(jsonPath("$.metodo").value("TARJETA_MOCK"))
                .andExpect(jsonPath("$.estado").value("APROBADO"))
                .andExpect(jsonPath("$.referencia").value(org.hamcrest.Matchers.startsWith("CRC-")));

        mockMvc.perform(get("/api/v1/reservas/mias").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(reservaId))
                .andExpect(jsonPath("$[0].estado").value("CONFIRMADA"));

        mockMvc.perform(get("/api/v1/pagos/mios").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reservaId").value(reservaId))
                .andExpect(jsonPath("$[0].estado").value("APROBADO"));
    }

    @Test
    void impideReservasSolapadasInclusoEntreUsuarios() throws Exception {
        Espacio espacio = crearEspacio();
        String tokenPrimero = registrarEIniciarSesion("primero");
        String tokenSegundo = registrarEIniciarSesion("segundo");
        LocalDate fecha = LocalDate.now().plusDays(61);
        crearReserva(tokenPrimero, espacio.getId(), fecha, "09:00", "11:00");

        mockMvc.perform(post("/api/v1/reservas")
                        .header("Authorization", bearer(tokenSegundo))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson(espacio.getId(), fecha, "10:00", "12:00")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Conflicto"))
                .andExpect(jsonPath("$.detail").value("El espacio ya esta reservado en ese horario"));
    }

    @Test
    void unUsuarioNoPuedeCancelarLaReservaDeOtro() throws Exception {
        Espacio espacio = crearEspacio();
        String tokenPropietario = registrarEIniciarSesion("propietario");
        String tokenAjeno = registrarEIniciarSesion("ajeno");
        long reservaId = crearReserva(tokenPropietario, espacio.getId(), LocalDate.now().plusDays(62), "13:00", "15:00");

        mockMvc.perform(patch("/api/v1/reservas/{id}/cancelar", reservaId)
                        .header("Authorization", bearer(tokenAjeno)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("La reserva no pertenece al usuario"));

        mockMvc.perform(get("/api/v1/reservas/mias").header("Authorization", bearer(tokenPropietario)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(reservaId))
                .andExpect(jsonPath("$[0].estado").value("PENDIENTE"));
    }

    private long crearReserva(String token, Long espacioId, LocalDate fecha, String inicio, String fin) throws Exception {
        String respuesta = mockMvc.perform(post("/api/v1/reservas")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson(espacioId, fecha, inicio, fin)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return ((Number) JsonPath.read(respuesta, "$.id")).longValue();
    }

    private String registrarEIniciarSesion(String prefijo) throws Exception {
        String sufijo = UUID.randomUUID().toString();
        String correo = prefijo + "-" + sufijo + "@example.com";
        String password = "ClaveSegura123";
        mockMvc.perform(post("/api/v1/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Usuario HTTP\",\"correo\":\"%s\",\"password\":\"%s\"}"
                                .formatted(correo, password)))
                .andExpect(status().isCreated());
        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"%s\",\"password\":\"%s\"}".formatted(correo, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return JsonPath.read(respuesta, "$.token");
    }

    private Espacio crearEspacio() {
        String sufijo = UUID.randomUUID().toString().substring(0, 8);
        Lugar lugar = new Lugar();
        lugar.setNombre("Lugar HTTP " + sufijo);
        lugar.setDescripcion("Lugar para pruebas de integración");
        lugar.setDireccion("San José, Costa Rica");
        lugar = lugares.save(lugar);

        TipoEspacio tipo = new TipoEspacio();
        tipo.setNombre("Tipo HTTP " + sufijo);
        tipo = tipos.save(tipo);

        CategoriaEspacio categoria = new CategoriaEspacio();
        categoria.setNombre("Categoría HTTP " + sufijo);
        categoria = categorias.save(categoria);

        Espacio espacio = new Espacio();
        espacio.setNombre("Espacio HTTP " + sufijo);
        espacio.setDescripcion("Espacio aislado para pruebas");
        espacio.setCapacidad(40);
        espacio.setLugar(lugar);
        espacio.setTipo(tipo);
        espacio.setCategoria(categoria);
        return espacios.save(espacio);
    }

    private String reservaJson(Long espacioId, LocalDate fecha, String inicio, String fin) {
        return "{\"fecha\":\"%s\",\"horaInicio\":\"%s\",\"horaFin\":\"%s\",\"cantidadPersonas\":20,\"espacioId\":%d}"
                .formatted(fecha, inicio, fin, espacioId);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
