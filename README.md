# Sistema de Reservas Institucionales

Aplicación web para administrar espacios y reservas institucionales de Guías y Scouts de Costa Rica.

## Tecnologías

- Backend: Java 17, Spring Boot, Spring Security, JWT, JPA y MySQL.
- Frontend: React y Vite.
- Base de datos: MySQL 8.

## Preparación local

1. Crea en MySQL la base de datos `reservas_institucionales`.
2. Copia `backend/src/main/resources/application-local.properties.example` como `backend/src/main/resources/application-local.properties`. El backend lo leerá desde el disco tanto si IntelliJ usa `backend` como el directorio raíz del repositorio.
3. Configura en ese archivo tu usuario y contraseña de MySQL y una clave JWT local.
4. Ejecuta `ReservasBackendApplication` desde IntelliJ IDEA.
5. En una terminal dentro de `frontend`, ejecuta:

```bash
npm install
npm run dev
```

6. Abre `http://localhost:5173`.

## Ejecución aislada con Docker

Esta opción levanta frontend, backend y MySQL sin usar la base de datos de IntelliJ ni TiDB. Requiere Docker con Compose.

1. Copia `.env.example` como `.env` en la raíz del repositorio.
2. Completa `DB_PASSWORD`, `DB_ROOT_PASSWORD` y `APP_JWT_SECRET` con valores locales distintos y seguros. El archivo `.env` está excluido de Git.
3. Ejecuta desde la raíz:

```bash
docker compose up --build -d
```

Abre `http://localhost:5173`. El frontend sirve las rutas de la aplicación y envía `/api` y `/uploads` al backend dentro de la red de Compose. MySQL y el backend no publican puertos al exterior; el frontend escucha solo en `127.0.0.1`. Los datos de MySQL y las imágenes subidas persisten en volúmenes.

Para ver los logs usa `docker compose logs -f`. `docker compose down` detiene los servicios sin borrar los datos. **No uses `docker compose down -v` si quieres conservar la base de datos y las imágenes**, porque elimina los volúmenes de este entorno. El workflow `Docker` construye ambas imágenes y comprueba el arranque y las rutas en una instancia temporal de GitHub Actions.

## Compartir una demostración sin dominio

El frontend utiliza un proxy local para enviar `/api` y `/uploads` al backend del puerto `8081`, por lo que basta con publicar un único puerto. Con MySQL, backend y frontend encendidos, instala `cloudflared` y ejecuta:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Comparte la dirección temporal `https://...trycloudflare.com` que aparece en la terminal. No es necesario configurar un dominio ni modificar CORS. El enlace cambia al reiniciar el túnel y la computadora debe permanecer encendida; esta modalidad es exclusivamente para pruebas.

Para cargar el catálogo local de demostración (Hostel y Campo Escuela), ejecuta `docs/DATOS_DEMO.sql` sobre la base `reservas_institucionales` desde MySQL Workbench. El script puede ejecutarse varias veces sin duplicar registros.

El backend utiliza `http://localhost:8081/api/v1` como URL base. El puerto puede cambiarse con la variable de entorno `SERVER_PORT`; en ese caso también debe configurarse `VITE_API_URL` en el frontend.

## Configuración por entorno

Para publicar el sistema en un dominio no es necesario modificar el código. Configura:

- `SERVER_PORT`: puerto del backend.
- `CORS_ALLOWED_ORIGINS`: dominio del frontend; admite varios valores separados por coma.
- `TARIFA_HORA`: tarifa institucional en colones.
- `UPLOAD_DIR`: directorio persistente para fotografías de espacios.
- `VITE_API_URL`: URL pública del backend terminada en `/api/v1`, definida al construir el frontend.
- `FRONTEND_URL`: URL usada para construir enlaces de recuperación.
- `MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` y `MAIL_FROM`: integración SMTP opcional.

El archivo `frontend/.env.example` muestra la configuración local. Los archivos `.env.local` y `application-local.properties` permanecen fuera de Git.

## Funciones actuales

- Dashboards diferenciados por rol: agenda y avisos para clientes; métricas, gráfico de estados y accesos de gestión para administradores.
- Registro e inicio de sesión con roles.
- Catálogo público de espacios.
- Fotografías de espacios con validación de formato real, límite de tamaño y almacenamiento configurable.
- Portadas propias para lugares y vistas previas de imágenes antes de guardar.
- Creación y seguimiento de reservas.
- Consulta de disponibilidad por lugar, fecha, horario y capacidad.
- Modificación y cancelación de reservas activas.
- Validación del horario institucional de 08:00 a 17:00.
- Protección transaccional contra reservas o pagos simultáneos duplicados.
- Flujo de pagos demostrativo en colones costarricenses.
- Pago guiado en tres pasos para tarjeta simulada, transferencia o efectivo.
- Tarifa por hora configurable desde el backend mediante `TARIFA_HORA` o la propiedad local correspondiente.
- Administración de lugares, espacios, usuarios, reservas y pagos.
- Separación de privilegios: solo `SUPERADMIN` administra roles y otras cuentas administrativas.
- Control de roles `USUARIO`, `ADMIN` y `SUPERADMIN`.
- Revocación inmediata de tokens para cuentas bloqueadas o inactivas.
- Invalidación de sesiones anteriores después de cambiar o recuperar la contraseña.
- Registro, edición del perfil y cambio de contraseña con política de seguridad uniforme.
- Recuperación local mediante token temporal de un solo uso.
- Un único token de recuperación vigente por cuenta, protegido contra reutilización concurrente.
- Centro de notificaciones internas para reservas y pagos.
- Notificaciones y recuperación por correo mediante SMTP configurable.
- Indicadores administrativos, gráfico por estados y reportes de reservas exportables a CSV/PDF.
- Comprobantes PDF descargables para pagos aprobados.
- Bitácora administrativa de cambios sensibles con actor y fecha.

El avance detallado de los requerimientos se encuentra en [docs/ESTADO_REQUERIMIENTOS.md](docs/ESTADO_REQUERIMIENTOS.md).

El despliegue manual y aislado a staging en Render, junto con los pasos pendientes para producción y rollback, se documenta en [docs/CD_RENDER.md](docs/CD_RENDER.md).

## Pruebas

El backend incluye pruebas unitarias y de integración para reservas, pagos, seguridad, recuperación, imágenes y reportes, además de pruebas HTTP con H2 en memoria. Se ejecutan desde `backend` con `mvn test` o directamente desde IntelliJ IDEA. Las pruebas nunca utilizan la base MySQL local.

La prueba E2E local usa Playwright con Chromium y recorre el registro, el inicio de sesión, el bloqueo de la ruta administrativa para un usuario común y la consulta de «Mis reservas». Playwright levanta automáticamente el backend con H2 temporal y el frontend en los puertos `8081` y `5173`; no usa MySQL, TiDB ni cuentas reales. Requiere Java 17 y Node.js 22. Desde `frontend`:

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

El workflow `E2E` ejecuta el escenario local en cada PR hacia `main` y guarda reportes y trazas como artefactos de GitHub Actions. El workflow `E2E staging` verifica además que el catálogo funcione al abrir y recargar su ruta directa, y recorre la creación y cancelación de una reserva, comprobando que el horario se libere. Este último utiliza cuentas de prueba y solo cancela la reserva creada por el propio test. El pago real de Stripe no forma parte del E2E: requiere configurar Stripe en el servidor; el pago simulado sí está cubierto por pruebas del backend.

Última verificación local: 57 pruebas del backend ejecutadas, sin fallos ni errores, con Java 17 y Spring Boot 4.1.0. La suite incluye catálogo público con sus relaciones e imágenes, registro, login, perfil con JWT, creación/edición/cancelación y aprobación administrativa de reservas, pagos en CRC, validación de firmas de webhook de Stripe, prevención de solapamientos, propiedad de recursos y autorización administrativa con respuestas 401/403/409. El estado más reciente de las ejecuciones automatizadas está disponible en la pestaña Actions del repositorio.

> Los pagos con tarjeta son una simulación. El sistema no solicita ni almacena información bancaria real.

## Seguridad

No se deben subir contraseñas, secretos JWT ni archivos `application-local.properties`. Cada integrante debe mantener su propia configuración local.
El build de Maven excluye explícitamente `application-local.properties` del JAR; para ejecutar un artefacto empaquetado deben utilizarse variables de entorno o un archivo externo.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
