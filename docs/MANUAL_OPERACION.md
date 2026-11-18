# Manual de Operación

Guía operativa para poner en marcha, monitorear, desplegar y recuperar el **Sistema de Reservas Institucionales** de Guías y Scouts de Costa Rica.

---

## 1. Ambientes y servicios

| Ambiente | Propósito | URL / Puerto | Base de datos y almacenamiento |
|---|---|---|---|
| **Local (IDE)** | Desarrollo y pruebas rápidas | Frontend `http://localhost:5173`, Backend `http://localhost:8081` | MySQL local (`reservas_institucionales`) y carpeta `UPLOAD_DIR` (`uploads`) |
| **Local (Docker Compose)** | Ejecución aislada y reproducible | `http://127.0.0.1:5173` (Nginx proxy `/api` y `/uploads` hacia `backend:8081`) | Volúmenes Docker `mysql_data` y `uploads_data` |
| **Desarrollo (Render)** | Validación automática de cada merge a `main` | Servicios `reservas-backend-dev` y `reservas-frontend-dev` | Base de datos y variables propias del ambiente `development` |
| **Staging (Render)** | Pruebas de aceptación, E2E y monitoreo Better Stack | `reservas-backend-staging` y `reservas-frontend-staging` | Base de datos de staging; perfil `betterstack` activo |
| **Producción (Render)** | Operación institucional | `sistema-reservas-backend` y `sistema-reservas-institucionales` | Base de datos productiva; despliegue manual con aprobación |

---

## 2. Operación local y con Docker

### Arranque con Docker Compose (recomendado para entorno limpio)

1. Copia `.env.example` como `.env` en la raíz del repositorio.
2. Completa `DB_PASSWORD`, `DB_ROOT_PASSWORD` y `APP_JWT_SECRET` (mínimo 32 caracteres).
3. Valida las variables obligatorias y la estructura de Compose sin iniciar servicios:

```powershell
docker compose config --quiet
```
4. Levanta los contenedores:

```powershell
docker compose up --build -d
```

5. Verifica el estado en `http://127.0.0.1:5173` y `http://127.0.0.1:5173/api/v1/status`.
6. Para ver logs en tiempo real: `docker compose logs -f`.
7. Para detener conservando datos e imágenes: `docker compose down` (evita `docker compose down -v` salvo que quieras borrar los volúmenes).

### Arranque sin Docker (IDE / terminal)

- **Backend:** configura `backend/src/main/resources/application-local.properties` a partir de `application-local.properties.example` y ejecuta `ReservasBackendApplication` (o `.\mvnw.cmd spring-boot:run`).
- **Frontend:** dentro de `frontend/`, ejecuta `npm ci` (o `npm install`) y `npm run dev`.

### Variables específicas de Compose

Esta aclaración procede de `compose.yaml`, `.env.example` y los Dockerfiles presentes en la rama. Estos archivos ya existen en la base compartida con `origin/main`; no son incorporaciones nuevas de `calidad-ci-docker`.

| Variable en `.env` | Efecto en Compose |
|---|---|
| `DB_PASSWORD` | Obligatoria. Contraseña del usuario MySQL `reservas` y valor enviado al backend como `SPRING_DATASOURCE_PASSWORD`. |
| `DB_ROOT_PASSWORD` | Obligatoria. Contraseña de root de MySQL, utilizada también por su healthcheck. |
| `APP_JWT_SECRET` | Obligatoria. Se transmite al backend para firmar tokens; utiliza al menos 32 caracteres. |
| `FRONTEND_PORT` | Puerto publicado solo en `127.0.0.1`; por defecto `5173`. |
| `FRONTEND_URL` | Por defecto `http://localhost:5173`; también alimenta `CORS_ALLOWED_ORIGINS` en Compose. Si cambias el puerto, ajusta esta URL. |
| `SPRING_JPA_SHOW_SQL`, `SPRING_JPA_FORMAT_SQL` | Valores enviados al contenedor para la configuración SQL; por defecto `false`. |

Compose fija la URL JDBC a `db:3306`, el usuario a `reservas`, `SERVER_PORT=8081` y `UPLOAD_DIR=/app/uploads`. La base de datos no publica un puerto al host y el backend solo expone `8081` a la red de contenedores. No se utiliza el puerto de MySQL configurado en `application-local.properties` del equipo. La imagen frontend se construye con `VITE_API_URL=/api/v1`; ese valor no se toma de `.env` durante la ejecución de Compose.

Mantén `.env` fuera de Git. `.dockerignore` excluye los archivos `.env*`, `application-local.properties` y las carpetas locales de uploads del contexto de construcción. Las opciones de integraciones externas ya listadas en la sección 3 no se amplían en esta actualización.

### Persistencia de datos en Compose

| Volumen | Montaje | Contenido |
|---|---|---|
| `mysql_data` | `/var/lib/mysql` en `db` | Datos de MySQL. |
| `uploads_data` | `/app/uploads` en `backend` | Imágenes subidas, mediante `UPLOAD_DIR=/app/uploads`. |

`docker compose down` retira contenedores y redes, conservando estos volúmenes. Al ejecutar de nuevo `docker compose up -d` con el mismo proyecto Compose, se reutilizan. Los nombres reales pueden llevar el prefijo del proyecto; cambiar el nombre del proyecto puede crear otros volúmenes y dar la impresión de que los datos desaparecieron.

`docker compose down -v` elimina los volúmenes: no lo uses para detener tu entorno si necesitas conservar los datos. La limpieza con `-v` del workflow Docker corresponde únicamente a los datos temporales de CI. Los volúmenes aportan persistencia entre recreaciones de contenedores, pero no constituyen una copia de seguridad.

Para comprobar la persistencia local, registra un dato y sube una imagen de prueba; ejecuta `docker compose down`, vuelve a iniciar con `docker compose up -d` y verifica ambos desde la aplicación. Este es un procedimiento propuesto de comprobación: no se ejecutó durante esta actualización documental.

---

## 3. Variables de entorno clave

| Variable | Uso | Obligatoria |
|---|---|---|
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Conexión a MySQL / TiDB | Sí (en servidor/Compose) |
| `APP_JWT_SECRET` | Firma HMAC para tokens JWT | Sí |
| `SERVER_PORT` | Puerto HTTP del backend (por defecto `8081`) | No |
| `CORS_ALLOWED_ORIGINS` | Orígenes web permitidos separados por coma | Sí en despliegue |
| `FRONTEND_URL` | URL pública del frontend para enlaces de recuperación y Stripe | Sí en despliegue |
| `VITE_API_URL` | URL base del backend terminada en `/api/v1` (en build de frontend) | Sí en hosting separado |
| `UPLOAD_DIR` | Directorio persistente para fotografías de lugares y espacios | Sí |
| `TARIFA_HORA` | Tarifa por hora inicial en colones (configurable también en **Administración > Precios**) | No (`25000` por defecto) |
| `MAIL_ENABLED`, `RESEND_API_KEY` o `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD` | Envío opcional de correos de notificaciones y recuperación | No |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Integración opcional con Stripe Checkout | No |
| `SPRING_PROFILES_ACTIVE`, `BETTERSTACK_SOURCE_TOKEN`, `BETTERSTACK_INGESTING_HOST` | Centralización de logs en Better Stack (**solo staging**) | No |

---

## 4. Operación de despliegue (CI/CD)

1. **Integración Continua:** todo cambio entra mediante rama (`feature/`, `bugfix/`, `hotfix/`) y Pull Request hacia `main`. La rama `main` exige 1 aprobación de revisión y checks en verde (`CI`, `Docker`).
2. **Despliegue a Desarrollo:** automático tras fusionar a `main` mediante `CD desarrollo (Render)` una vez pasan `CI`, `Docker` y `E2E`.
3. **Despliegue a Staging:** manual desde **GitHub > Actions > `CD staging (Render)`** (`operation=deploy`). Posteriormente ejecutar **E2E staging** para validar registro, catálogo, reserva y cancelación.
4. **Despliegue a Producción:** manual desde **GitHub > Actions > `CD producción (Render)`** (`main`), escribiendo `PRODUCCION` como confirmación. El job se detiene en estado *Waiting* hasta que una persona revisora distinta al iniciador apruebe el environment `production`.

El detalle completo de scripts, validaciones y errores comunes está en [CD_RENDER.md](CD_RENDER.md).

---

## 5. Monitoreo y atención de incidentes

### Monitoreo interno (**Administración > Diagnóstico**)

- Requiere rol `ADMIN` o `SUPERADMIN`.
- El backend evalúa cada 60 segundos: disponibilidad de la aplicación, conexión a base de datos (`connection.isValid(2)`), escritura en `UPLOAD_DIR`, configuración de correo y configuración de Stripe.
- El panel se actualiza automáticamente cada 30 segundos o manualmente con **Actualizar ahora**.
- Los errores HTTP 5xx devuelven un `correlationId` seguro sin filtrar detalles internos y crean o agrupan un incidente en `incidentes_soporte`.
- Una vez corregida la causa, el administrador debe pulsar **Marcar como resuelto**; la acción queda registrada en la bitácora (`auditoria`).

### Monitoreo externo y logs (Better Stack en staging)

- **Monitores Uptime:** revisan disponibilidad periódica de `Backend de staging` y `frontend de staging`.
- **Logs centralizados (`Live tail`):** reciben los logs de `reservas-backend-staging` cuando `SPRING_PROFILES_ACTIVE=betterstack`.
- **Alertas:** regla configurada para `"Se detectó un error interno"` (`value > 0`) con notificación por correo al equipo.
- Para el procedimiento de diagnóstico, límites y política de retención de 90 días para incidentes resueltos, consulta [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## 6. Procedimiento de rollback ante fallos

| Ambiente | Procedimiento |
|---|---|
| **Desarrollo** | Usar `Revert` del Pull Request problemático en GitHub y fusionar a `main`; `CD desarrollo` desplegará el commit anterior tras pasar los checks. |
| **Staging** | En Render > servicio afectado > **Deploys**, copiar el ID (`dep-...`) del último despliegue exitoso (`live` o `deactivated`). Luego ejecutar `CD staging (Render)` con `operation=rollback`, `rollback_service` y `rollback_deploy_id`. |
| **Producción** | Copiar el `dep-...` exitoso anterior del servicio afectado en Render y ejecutar `CD producción (Render)` con `operation=rollback`, `rollback_service`, `rollback_deploy_id` y `confirmacion=PRODUCCION`. Requiere aprobación explícita en el environment `production`. |

**Importante:** el rollback de Render revierte la versión de código/build, pero **no revierte cambios en la base de datos** ni archivos externos. Verifica siempre `/api/v1/status` y `/login` después de completar la reversión y registra el incidente.
