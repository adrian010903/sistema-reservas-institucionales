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

- Los logs completos siguen en la plataforma de despliegue; esta pantalla centraliza incidentes resumidos, no sustituye un proveedor de logs centralizados.
- No se envían avisos externos por correo, SMS o Slack. La alerta aparece en el panel mientras una persona administradora lo consulta.
- Una caída total de la base de datos impide guardar el incidente en la misma base. Para esa situación, consulta los logs/estado del servicio en Render.
- La configuración detectada de correo y Stripe no valida conectividad, dominio, firma de webhook ni entrega real.
- El historial no tiene política automática de expiración todavía. Antes de operación prolongada, definir retención y respaldo.

## Validación local

El endpoint de consulta es `GET /api/v1/admin/diagnostico`; resolver requiere `PATCH /api/v1/admin/diagnostico/incidentes/{id}/resolver`. Ambos exigen rol administrativo. Las pruebas automatizadas comprueban autorización 401/403, registro de errores sin mensajes sensibles, respuesta de error con referencia segura y resolución auditada.

```powershell
cd backend
.\mvnw.cmd --batch-mode --no-transfer-progress test
```

La suite usa H2 en memoria, no TiDB, cuentas reales ni servicios de producción.
