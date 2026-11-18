# Diagnóstico y soporte

## Acceso

Inicia sesión con una cuenta `ADMIN` o `SUPERADMIN`, abre **Administración > Diagnóstico** y usa **Actualizar ahora** para ejecutar una consulta inmediata. El panel actualiza sus datos cada 30 segundos mientras permanece abierto. El monitor del backend revisa los componentes cada 60 segundos.

## Comprobaciones disponibles

- **Aplicación:** confirma que el backend responde e informa su tiempo activo.
- **Base de datos:** intenta obtener una conexión y validarla. No muestra URL, usuario ni contraseña.
- **Imágenes:** verifica si el directorio configurado para las cargas, o un directorio padre existente si aún no se ha creado, permite escritura. No revela la ruta física.
- **Correo:** indica si el envío está desactivado, si hay un proveedor configurado o si falta configuración. La presencia de valores no prueba que Resend/SMTP acepte correos.
- **Stripe:** indica si ambas claves requeridas están presentes o si falta alguna. No llama a Stripe ni muestra valores.

Las verificaciones son de solo lectura: no crean archivos, no envían mensajes y no ejecutan pagos.

## Incidentes

Los errores internos HTTP 5xx y las fallas detectadas por el monitor se guardan en `incidentes_soporte`. Errores repetidos del mismo tipo y método HTTP se agrupan mientras el incidente siga abierto. Se conserva un identificador de correlación, componente, tipo técnico, fechas, cantidad de ocurrencias y una recomendación basada en patrones conocidos. No se almacena el mensaje original de la excepción, la URL solicitada, el cuerpo, parámetros, claves, contraseñas ni tokens.

Las recomendaciones orientan la investigación, no confirman la causa raíz. Para seguir un incidente, usa su identificador y hora en los logs del backend de Render. Cuando se resuelva el problema, administración puede marcarlo como resuelto; actor y fecha se registran en la bitácora. Los incidentes de salud se cierran automáticamente cuando el monitor vuelve a verificar el componente como operativo.

## Límites actuales

- El panel interno centraliza incidentes resumidos en la base de datos; los logs completos de aplicación viven en Render y, para staging, en Better Stack cuando el perfil `betterstack` está activo.
- Las alertas internas del panel solo son visibles cuando una persona administradora lo consulta; las alertas externas por correo dependen de Better Stack (ver sección siguiente).
- Una caída total de la base de datos impide guardar el incidente en `incidentes_soporte`. Para esa situación, consulta los logs y monitores en Render o Better Stack.
- La configuración detectada de correo y Stripe no valida conectividad, dominio, firma de webhook ni entrega real.

## Conservación y retención de incidentes

El historial de `incidentes_soporte` se conserva bajo las siguientes reglas operativas:

1. **Incidentes `ABIERTO`:** no se eliminan ni caducan automáticamente; permanecen visibles en **Administración > Diagnóstico** hasta que el monitor los cierre por recuperación del componente o un administrador los marque como resueltos (acción que queda registrada en `auditoria`).
2. **Incidentes `RESUELTO`:** se conservan en la base de datos durante **al menos 90 días** desde su fecha de resolución (`resuelta_en`) como respaldo para auditorías, análisis de recurrencia y defensa del proyecto. La consulta en el panel muestra los **100 incidentes más recientes** ordenados por `ultima_vez`.
3. **Limpieza controlada:** el sistema no ejecuta purga automática en este momento; transcurridos 90 días desde la resolución, la depuración de registros `RESUELTO` antiguos debe realizarse mediante mantenimiento controlado de base de datos (previo respaldo).
4. **Respaldo externo:** los logs detallados enviados a Better Stack (staging) y los logs de plataforma en Render conservan su propia retención según el plan activo de cada servicio.

## Logs centralizados, monitores y alertas (staging en Better Stack)

El backend puede enviar sus logs a una fuente de Better Stack usando el appender
Logback incluido (`com.logtail:logback-logtail`). La integración está apagada por defecto; para activarla solo en
`reservas-backend-staging`, configura estas variables en el servicio de Render:

| Variable | Valor |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `betterstack` |
| `BETTERSTACK_SOURCE_TOKEN` | Source token de la fuente Java en Better Stack (marcar como secreto) |
| `BETTERSTACK_INGESTING_HOST` | Host de ingesta mostrado por Better Stack, sin `https://` |

No configures `SPRING_PROFILES_ACTIVE=betterstack` ni el token en producción. El
backend conserva el appender de consola y duplica sus logs hacia Better Stack
cuando el perfil está activo. La integración directa transmite logs de la
aplicación, no logs de build/deploy de Render ni del Static Site del frontend.
Evita escribir datos personales, credenciales o contenido de solicitudes en los
logs. Revisa la cuota de Better Stack antes de habilitar la ingesta.

Render también permite configurar Log Streams a nivel de workspace, pero el
destino predeterminado incluye todos los servicios compatibles. En el plan Hobby
no se puede excluir un servicio individual, así que no uses ese destino global
si debe mantenerse producción fuera de Better Stack.

### Estado verificado en staging (17/11/2026)

- **Ingesta de logs:** tras corregir el empaquetado de `logback-logtail-0.4.0.jar` en el JAR ejecutable (PR #36) y activar `SPRING_PROFILES_ACTIVE=betterstack`, `reservas-backend-staging` arrancó correctamente y se verificaron logs reales entrando en **Better Stack > Live tail** (run `44194179235`).
- **Monitores de disponibilidad:** configurados en Better Stack para `Backend de staging` y `frontend de staging` (chequeos cada 3 minutos, en estado `Up`).
- **Alerta externa sobre logs:** configurada la regla `value > 0` sobre la consulta `"Se detectó un error interno"` en `reservas-backend-staging`, notificando al equipo (`Current team`). Se comprobó la entrega del correo mediante **Send a test alert**. Queda pendiente únicamente validar el disparo de esa alerta con un fallo real controlado en staging.

## Validación local

El endpoint de consulta es `GET /api/v1/admin/diagnostico`; resolver requiere `PATCH /api/v1/admin/diagnostico/incidentes/{id}/resolver`. Ambos exigen rol administrativo. Las pruebas automatizadas comprueban autorización 401/403, registro de errores sin mensajes sensibles, respuesta de error con referencia segura y resolución auditada.

```powershell
cd backend
.\mvnw.cmd --batch-mode --no-transfer-progress test
```

La suite usa H2 en memoria, no TiDB, cuentas reales ni servicios de producción.
