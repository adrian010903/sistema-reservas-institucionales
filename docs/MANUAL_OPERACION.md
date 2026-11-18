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
3. Levanta los contenedores:

```powershell
docker compose up --build -d
```

4. Verifica el estado en `http://127.0.0.1:5173` y `http://127.0.0.1:5173/api/v1/status`.
5. Para ver logs en tiempo real: `docker compose logs -f`.
6. Para detener conservando datos e imágenes: `docker compose down` (evita `docker compose down -v` salvo que quieras borrar los volúmenes).

### Arranque sin Docker (IDE / terminal)

- **Backend:** configura `backend/src/main/resources/application-local.properties` a partir de `application-local.properties.example` y ejecuta `ReservasBackendApplication` (o `.\mvnw.cmd spring-boot:run`).
- **Frontend:** dentro de `frontend/`, ejecuta `npm ci` (o `npm install`) y `npm run dev`.

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
