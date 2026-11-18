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

Backend (unitarias, integración, cobertura y análisis estático):

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
| E2E staging | 16/11/2026 | 4 de 4 aprobadas | [Ejecución en Actions](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44000560355); [reporte Playwright](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44000560355/artifacts/14291677652) |

Los reportes de Playwright se descargan como archivo `.zip` desde la ejecución. Al abrir `index.html` se ve cada escenario marcado como aprobado o fallido, con capturas y traza de los que fallan.

## Calidad del backend en `calidad-ci-docker`


### SpotBugs y Find Security Bugs

`backend/pom.xml` incorpora `spotbugs-maven-plugin` **4.10.5.0** y el detector `findsecbugs-plugin` **1.14.0**. El análisis usa `effort=Max`, `threshold=High` y `failOnError=true`. Por tanto, el check bloquea el proceso cuando SpotBugs detecta hallazgos configurados con nivel High.; no equivale a demostrar que no existen otros problemas de seguridad.

La ejecución `spotbugs-check` está vinculada a la fase `verify`. El filtro `backend/spotbugs-exclude.xml` excluye únicamente `SPRING_CSRF_PROTECTION_DISABLED` para `cr.or.guiasyscouts.reservas.config.SecurityConfig`; no deshabilita todas las comprobaciones de esa clase ni todos los detectores de seguridad.

Para reproducir el check desde `backend/` con Java 17:

```bash
bash ./mvnw --batch-mode --no-transfer-progress -DskipTests compile spotbugs:check
```

En PowerShell, sustituye `bash ./mvnw` por `.\mvnw.cmd`. Este comando compila y analiza el backend sin ejecutar las pruebas. Para pruebas y cobertura por separado, como en CI:

```bash
bash ./mvnw --batch-mode --no-transfer-progress -Dspotbugs.skip=true verify
```

### Check `Backend Static Analysis` y correcciones

En `.github/workflows/ci.yml`, el job `backend-static-analysis` se muestra como **Backend Static Analysis**, usa Temurin 17 y tiene un límite de 20 minutos. Ejecuta el primer comando anterior de forma independiente de **Backend tests**. Los jobs de pruebas de CI y Docker usan `-Dspotbugs.skip=true verify` para evitar repetir el análisis.

El workflow CI se activa en pull requests hacia `main` y en pushes a `main`, `feature/**` y `bugfix/**`. Un push directo a `calidad-ci-docker` no está incluido en esos patrones; la configuración permite analizarla mediante un pull request hacia `main`. El YAML no demuestra por sí solo que el check sea obligatorio en la protección de la rama.

El commit `51776e2` contiene estas correcciones tras el análisis estático:

| Archivo | Corrección observable |
|---|---|
| `JwtService.java` | Usa `StandardCharsets.UTF_8` al convertir el secreto a bytes, evitando depender de la codificación predeterminada del equipo. |
| `ApiExceptionHandler.java` | Guarda `exception.getReason()` en una variable y valida ese mismo valor antes de usarlo. |
| `ImagenEspacioService.java` | Comprueba si `Path.getFileName()` devuelve `null` antes de convertirlo a texto al eliminar la imagen anterior. |

### Artefactos de CI

| Artefacto | Fuente | Condición de publicación |
|---|---|---|
| `backend-build` | `backend/target/*.jar` | Se publica tras el paso de pruebas satisfactorio, conserva los archivos 14 días y falla si no encuentra el JAR. Es una adición de esta rama. |
| `backend-coverage-report` | `backend/target/site/jacoco/` | El paso se intenta incluso si falla un paso anterior (`always()`); ignora la ausencia de archivos. Ya existía en la base compartida. |
| `backend-test-results` (workflow Docker) | `backend/target/surefire-reports/` y `backend/target/site/jacoco/` | Se intenta con `always()` e ignora archivos ausentes. Ya existía en la base compartida. |

JaCoCo genera el reporte durante `verify`; el comando aislado de SpotBugs no genera cobertura. La configuración de JaCoCo no establece un mínimo obligatorio de cobertura. Los artefactos disponibles se consultan en la ejecución correspondiente de GitHub Actions; La ejecución del PR #41 confirmó la publicación de `backend-build` y `backend-coverage-report`..

### Validación Docker/Compose

La validación existente en `.github/workflows/docker.yml` ejecuta `docker compose config --quiet`, construye las imágenes y arranca los servicios. Después espera una respuesta satisfactoria de `/api/v1/status` a través del frontend y comprueba que `/login` contiene `id="root"`, con hasta 60 intentos separados por 3 segundos. Si falla, muestra logs; al finalizar elimina los contenedores y volúmenes temporales del runner con `docker compose down -v`.

Es una prueba de construcción y arranque, no una prueba de recuperación de datos. La persistencia local y las variables necesarias se explican en [MANUAL_OPERACION.md](MANUAL_OPERACION.md#persistencia-de-datos-en-compose). Esta validación ya existía en la base compartida; el cambio propio de la rama es omitir SpotBugs en su job de pruebas para centralizarlo en **Backend Static Analysis**.

En la validación del PR #41, los workflows CI, Docker, E2E y Pruebas CD finalizaron correctamente.