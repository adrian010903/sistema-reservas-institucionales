# Estructura del frontend

El frontend mantiene `WorkspaceApp.jsx` como composición temporal: conserva el
estado compartido, las llamadas que modifican datos y la decisión de navegación.
Las pantallas no deben concentrar ese estado; reciben datos y acciones mediante
propiedades. Esto permite mover cada flujo gradualmente sin cambiar su resultado.

## Carpetas

- `src/pages/`: pantallas completas y flujos de usuario.
- `src/components/`: piezas visuales reutilizables que no son una pantalla.
- `src/services/`: acceso al backend y funciones relacionadas con HTTP.
- `src/utils/`: transformaciones puras, validaciones y formatos compartidos.

## Pantallas ya extraídas

- `HomePage`: inicio público.
- `AuthPage`: inicio de sesión, registro y recuperación.
- `ClientDashboard`: panel del usuario cliente.
- `ReservationsPage`: historial y acciones sobre reservas propias.
- `PaymentsPage`: selección de reserva, método de pago e historial.
- `NotificationsPage` y `ProfilePage`: flujos personales.

## Convenciones

1. Una página no debe llamar directamente a `fetch`; las llamadas nuevas van en
   `services/` y se invocan desde el contenedor correspondiente.
2. Los textos de estado, moneda y fecha se formatean con `utils/formatters.js`.
3. Los componentes no modifican estado global: reciben callbacks con nombres
   `on...`.
4. Antes de integrar una extracción, ejecutar `npm run lint` y `npm run build`.

Las pantallas de catálogo, nueva reserva y administración son los siguientes
flujos que se migrarán fuera del contenedor temporal.
