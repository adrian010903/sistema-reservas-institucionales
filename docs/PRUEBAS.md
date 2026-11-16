# Pruebas del sistema

En este documento se listan las pruebas automatizadas que tiene el proyecto, separadas por tipo.

## Tipos de prueba

| Tipo | Qué revisa | Herramienta | Dónde están |
|------|------------|-------------|-------------|
| Unitarias | Una parte del código por separado | JUnit y Mockito | `backend/src/test/java` |
| Integración | Varias partes funcionando juntas | Spring Boot Test | `backend/src/test/java` (archivos `*HttpIntegrationTest`) |
| E2E | La página completa usada como un usuario | Playwright | `frontend/e2e` |
| Cobertura | Qué porcentaje del código ejecutan las pruebas | JaCoCo | Reporte que genera el CI |

## Pruebas unitarias

Revisan una parte del código por separado. Están en `backend/src/test/java`.

| Archivo | Cantidad | Qué revisa |
|---------|----------|------------|
| ReservaServiceTest | 6 | Horario permitido, capacidad del espacio y que no se crucen reservas |
| PagoServiceTest | 5 | Pagos con tarjeta y transferencia, y que no se pague una reserva ajena o cancelada |
| StripeGatewayServiceTest | 5 | Validación de los avisos que manda la pasarela de pago |
| TarifaServiceTest | 2 | Leer y cambiar la tarifa |
| AdminUsuarioControllerTest | 10 | Qué puede hacer un administrador con los usuarios |
| JwtServiceTest | 2 | Validez del token de sesión |
| JwtAuthenticationFilterTest | 2 | Que un usuario deshabilitado no pueda entrar |
| CustomUserDetailsServiceTest | 2 | Estado del usuario (activo o bloqueado) |
| UsuarioServiceTest | 1 | Que los tokens viejos dejen de servir |
| RecuperacionPasswordServiceTest | 2 | Recuperar contraseña |
| ApiExceptionHandlerTest | 3 | Que los errores no muestren información interna |
| ReporteAnaliticoServiceTest | 3 | Cálculos y filtros de los reportes |
| ReportePdfVisualServiceTest | 3 | Generación del reporte en PDF |
| ImagenEspacioServiceTest | 3 | Subida de imágenes de los espacios |

Total: 49 pruebas unitarias.

## Pruebas de integración

Revisan que varias partes funcionen juntas, haciendo peticiones reales a la API con una base de datos de prueba.

| Archivo | Cantidad | Qué revisa |
|---------|----------|------------|
| ReservaPagoHttpIntegrationTest | 10 | Crear, editar, pagar, aprobar y cancelar reservas |
| SecurityHttpIntegrationTest | 7 | Registro, inicio de sesión y rutas protegidas |
| AdminUsuarioHttpIntegrationTest | 3 | Crear, desactivar y eliminar usuarios |
| DiagnosticoHttpIntegrationTest | 2 | Panel de diagnóstico y registro de incidentes |
| ReservasBackendApplicationTests | 1 | Que la aplicación arranque |

Total: 23 pruebas de integración.

## Pruebas E2E

Usan un navegador automático (Playwright) que entra a la página como lo haría un usuario. Están en `frontend/e2e/auth-reservations.spec.js`.

| Escenario | Dónde se ejecuta |
|-----------|------------------|
| Registrarse, iniciar sesión y ver mis reservas | Local y staging |
| Abrir el catálogo y recargar la página | Staging |
| Crear una reserva y cancelarla | Staging |

## Cobertura

La cobertura indica qué porcentaje del código del backend ejecutan las pruebas.

| Herramienta | Cuándo se genera | Dónde queda |
|-------------|------------------|-------------|
| JaCoCo | Al correr las pruebas del backend | En el CI de GitHub Actions, como artefacto |

## Cómo ejecutarlas

Backend (unitarias, integración y cobertura):

```bash
cd backend
./mvnw verify
```

E2E:

```bash
cd frontend
npm ci
npx playwright install
npm run test:e2e
```
