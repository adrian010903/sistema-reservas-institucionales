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
| StripePaymentServiceTest | 6 | Cobro con Stripe: cálculo del monto, pagos no permitidos, pago aprobado y pago vencido |
| TarifaServiceTest | 2 | Leer y cambiar la tarifa |
| NotificacionServiceTest | 5 | Crear avisos y enviar correo, avisar a los administradores y marcar como leída solo la propia |
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

Total: 60 pruebas unitarias.

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
| Un administrador aprueba la reserva de un usuario y el usuario la paga con tarjeta simulada (`admin-aprobacion.spec.js`) | Staging (requiere `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD`) |

## Cobertura

La cobertura indica qué porcentaje del código del backend ejecutan las pruebas.

| Herramienta | Cuándo se genera | Dónde queda |
|-------------|------------------|-------------|
| JaCoCo | Al correr las pruebas del backend | En el CI de GitHub Actions, como artefacto |

## Partes sin pruebas

Partes del sistema que no tenían pruebas propias al revisar el proyecto, y qué se hizo con cada una.

| Parte | Tipo de prueba que falta | Decisión |
|-------|--------------------------|----------|
| Cobro con Stripe (`StripePaymentService`) | Unitaria | Agregada en `StripePaymentServiceTest` (6 pruebas) |
| Administrador aprueba una reserva | E2E | Agregada en `admin-aprobacion.spec.js` |
| Notificaciones (`NotificacionService`) | Unitaria | Agregada en `NotificacionServiceTest` (5 pruebas) |
| Pago desde la página | E2E | Agregado en `admin-aprobacion.spec.js` (pago con tarjeta simulada) |

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

## Resultados

| Suite | Fecha | Resultado | Evidencia |
|-------|-------|-----------|-----------|
| Backend (unitarias + integración) | 16/11/2026 | 83 de 83 aprobadas | `./mvnw verify` local y CI de la rama `feature/pruebas-finales` |
| Cobertura JaCoCo | 16/11/2026 | 72.9 % de líneas, 50.9 % de ramas | Reporte `backend/target/site/jacoco/index.html` y artefacto del CI |
| CI, E2E local y Docker en GitHub Actions | 16/11/2026 | Aprobados en cada push de la rama | Pestaña Actions de la rama `feature/pruebas-finales`; [reporte Playwright E2E](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/43977628417/artifacts/14282360526) |
| E2E staging | 16/11/2026 | 4 de 4 aprobadas | [Ejecución en Actions](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/43982765933); [reporte Playwright](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/43982765933/artifacts/14282414855) |

Los reportes de Playwright se descargan como archivo `.zip` desde la ejecución. Al abrir `index.html` se ve cada escenario marcado como aprobado o fallido, con capturas y traza de los que fallan.