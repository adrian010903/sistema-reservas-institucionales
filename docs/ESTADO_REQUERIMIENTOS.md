# Estado de requerimientos funcionales

Matriz de seguimiento basada en el documento de procesos y requerimientos del Sistema Integrado de Reservas Institucionales.

| Código | Requerimiento | Estado | Evidencia actual |
|---|---|---|---|
| RF-01 | Registrar usuario | Implementado | `POST /api/v1/auth/registro` |
| RF-02 | Iniciar sesión | Implementado | JWT, control de estado y roles |
| RF-03 | Recuperar contraseña | Parcial | Token seguro de un solo uso y 30 minutos; falta proveedor de correo |
| RF-04 | Gestionar perfil | Implementado | Actualización de nombre, correo y contraseña |
| RF-05 | Registrar espacio | Implementado | Administración por lugar, tipo y categoría |
| RF-06 | Editar espacio | Implementado | Datos, estado e imagen |
| RF-07 | Eliminar espacio | Implementado | Desactivación lógica para conservar historial |
| RF-08 | Consultar espacios disponibles | Implementado | Catálogo público y consulta de disponibilidad |
| RF-09 | Filtrar por fecha, hora y tipo | Parcial | Fecha, hora, lugar y capacidad; falta selector de tipo en interfaz |
| RF-10 | Realizar reserva | Implementado | Validación de horario, capacidad y solapamiento |
| RF-11 | Consultar reservas | Implementado | Historial personal y listado administrativo |
| RF-12 | Modificar reserva | Implementado | Solo reservas pendientes o aprobadas |
| RF-13 | Cancelar reserva | Implementado | Cancelación lógica y liberación del horario |
| RF-14 | Validar disponibilidad | Implementado | Endpoint y formulario en catálogo |
| RF-15 | Evitar reservas duplicadas | Implementado | Validación de intervalos solapados |
| RF-16 | Registrar pago | Implementado (mock) | Tarjeta simulada, transferencia y efectivo |
| RF-17 | Generar comprobante | Pendiente | Falta comprobante PDF para pagos aprobados |
| RF-18 | Gestionar usuarios | Implementado | Listado, estado y rol |
| RF-19 | Asignar roles | Implementado | Restricción especial para SUPERADMIN |
| RF-20 | Gestionar reservas | Implementado | Aprobar y rechazar solicitudes pendientes |
| RF-21 | Generar reportes | Implementado | Indicadores y exportación CSV filtrable de reservas |
| RF-22 | Gestionar pagos | Implementado (mock) | Validación administrativa de pagos pendientes |
| RF-23 | Enviar notificaciones | Parcial | Centro interno persistente y avisos automáticos; falta proveedor de correo |
| RF-24 | Mostrar validaciones | Implementado | Mensajes del backend presentados en frontend |
| RF-25 | Controlar permisos por rol | Implementado | Spring Security y controles visuales por rol |

## Reglas de negocio destacadas

- Las contraseñas se almacenan con BCrypt y los correos son únicos.
- Los usuarios bloqueados o inactivos no pueden iniciar sesión.
- Los lugares y espacios se desactivan sin borrar información histórica.
- Las reservas ocupan un horario mientras estén pendientes, aprobadas o confirmadas.
- Una reserva cancelada libera automáticamente el intervalo.
- Los pagos rechazados pueden intentarse nuevamente.
- Las operaciones administrativas requieren rol `ADMIN` o `SUPERADMIN`.

## Próximos bloques

1. Integrar correo para recuperación y notificaciones.
2. Comprobante PDF para pagos aprobados.
3. Notificaciones internas.
4. Ampliar reportes con gráficos y PDF.
5. Pruebas automatizadas de servicios y controladores.
