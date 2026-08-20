# Estado de requerimientos funcionales

Matriz de seguimiento basada en el documento de procesos y requerimientos del Sistema Integrado de Reservas Institucionales.

| Código | Requerimiento | Estado | Evidencia actual |
|---|---|---|---|
| RF-01 | Registrar usuario | Implementado | `POST /api/v1/auth/registro` |
| RF-02 | Iniciar sesión | Implementado | JWT, control de estado y roles |
| RF-03 | Recuperar contraseña | Implementado (configurable) | Token seguro de un solo uso, 30 minutos y enlace por SMTP opcional |
| RF-04 | Gestionar perfil | Implementado | Actualización de nombre, correo y contraseña |
| RF-05 | Registrar espacio | Implementado | Administración por lugar, tipo y categoría |
| RF-06 | Editar espacio | Implementado | Datos, estado e imagen |
| RF-07 | Eliminar espacio | Implementado | Desactivación lógica para conservar historial |
| RF-08 | Consultar espacios disponibles | Implementado | Catálogo público y consulta de disponibilidad |
| RF-09 | Filtrar por fecha, hora y tipo | Implementado | Fecha, horario, lugar, tipo y capacidad en catálogo público |
| RF-10 | Realizar reserva | Implementado | Validación de horario, capacidad y solapamiento |
| RF-11 | Consultar reservas | Implementado | Historial personal y listado administrativo |
| RF-12 | Modificar reserva | Implementado | Solo pendientes/aprobadas sin pago vigente; recalcula revisión |
| RF-13 | Cancelar reserva | Implementado | Cancelación lógica y liberación del horario |
| RF-14 | Validar disponibilidad | Implementado | Endpoint y formulario en catálogo |
| RF-15 | Evitar reservas duplicadas | Implementado | Validación de solapamientos y bloqueo transaccional por espacio |
| RF-16 | Registrar pago | Implementado (mock) | Tarjeta simulada, transferencia y efectivo |
| RF-17 | Generar comprobante | Implementado | PDF descargable únicamente para pagos aprobados |
| RF-18 | Gestionar usuarios | Implementado | Listado, estado y rol |
| RF-19 | Asignar roles | Implementado | Restricción especial para SUPERADMIN |
| RF-20 | Gestionar reservas | Implementado | Aprobar y rechazar solicitudes pendientes |
| RF-21 | Generar reportes | Implementado | Indicadores, gráfico por estados y exportación CSV/PDF filtrable |
| RF-22 | Gestionar pagos | Implementado (mock) | Validación administrativa de pagos pendientes |
| RF-23 | Enviar notificaciones | Implementado (configurable) | Centro interno persistente y envío SMTP opcional para eventos automáticos |
| RF-24 | Mostrar validaciones | Implementado | Respuestas Problem Details uniformes y mensajes presentados en frontend |
| RF-25 | Controlar permisos por rol | Implementado | Spring Security, revocación inmediata por estado y controles visuales |

## Reglas de negocio destacadas

- Las contraseñas se almacenan con BCrypt, deben tener entre 8 y 72 caracteres e incluir mayúscula, minúscula y número; los correos son únicos.
- Los usuarios bloqueados o inactivos no pueden iniciar sesión.
- Los tokens emitidos previamente dejan de autorizar peticiones tan pronto la cuenta se bloquea o desactiva.
- Cambiar o recuperar la contraseña incrementa la versión de credenciales e invalida todos los JWT anteriores.
- Los errores de autenticación y permisos usan respuestas JSON Problem Details con códigos 401/403.
- Los lugares y espacios se desactivan sin borrar información histórica.
- Las reservas ocupan un horario mientras estén pendientes, aprobadas o confirmadas.
- La creación y modificación bloquean transaccionalmente el espacio para evitar reservas simultáneas duplicadas.
- Una reserva cancelada libera automáticamente el intervalo.
- Los pagos rechazados pueden intentarse nuevamente.
- Una reserva con pago aprobado o pendiente de verificación no puede cambiar de horario y dejar un monto inconsistente.
- El registro y la validación de pagos usan bloqueos transaccionales para impedir decisiones concurrentes inconsistentes.
- La tarifa demostrativa tiene una única fuente configurable en el backend y se publica al frontend en colones costarricenses.
- Las operaciones administrativas requieren rol `ADMIN` o `SUPERADMIN`.
- Las modificaciones sensibles de catálogo, usuarios, reservas y pagos dejan una entrada inmutable en la bitácora administrativa.
- Los orígenes web permitidos se configuran por entorno para soportar desarrollo local y dominio institucional.

## Próximos bloques

1. Configurar y verificar una cuenta SMTP institucional real.
2. Verificación visual final del comprobante y la bitácora con backend ejecutándose.
3. Ampliar las pruebas automatizadas existentes hacia controladores y seguridad HTTP.
