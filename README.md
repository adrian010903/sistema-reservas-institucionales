# Sistema de Reservas Institucionales

Aplicación web para administrar espacios y reservas institucionales de Guías y Scouts de Costa Rica.

## Tecnologías

- Backend: Java 17, Spring Boot, Spring Security, JWT, JPA y MySQL.
- Frontend: React y Vite.
- Base de datos: MySQL 8.

## Preparación local

1. Crea en MySQL la base de datos `reservas_institucionales`.
2. Copia `backend/src/main/resources/application-local.properties.example` como `application-local.properties`.
3. Configura en ese archivo tu usuario y contraseña de MySQL y una clave JWT local.
4. Ejecuta `ReservasBackendApplication` desde IntelliJ IDEA.
5. En una terminal dentro de `frontend`, ejecuta:

```bash
npm install
npm run dev
```

6. Abre `http://localhost:5173`.

El backend utiliza `http://localhost:8081/api/v1` como URL base. El puerto puede cambiarse con la variable de entorno `SERVER_PORT`; en ese caso también debe configurarse `VITE_API_URL` en el frontend.

## Funciones actuales

- Registro e inicio de sesión con roles.
- Catálogo público de espacios.
- Creación y seguimiento de reservas.
- Consulta de disponibilidad por lugar, fecha, horario y capacidad.
- Modificación y cancelación de reservas activas.
- Validación del horario institucional de 08:00 a 17:00.
- Flujo de pagos demostrativo en colones costarricenses.
- Tarifa por hora configurable desde el backend mediante `TARIFA_HORA` o la propiedad local correspondiente.
- Administración de lugares, espacios, usuarios, reservas y pagos.
- Control de roles `USUARIO`, `ADMIN` y `SUPERADMIN`.
- Registro, edición del perfil y cambio de contraseña con política de seguridad uniforme.
- Recuperación local mediante token temporal de un solo uso.
- Centro de notificaciones internas para reservas y pagos.
- Indicadores administrativos y reportes de reservas exportables a CSV.
- Comprobantes PDF descargables para pagos aprobados.
- Bitácora administrativa de cambios sensibles con actor y fecha.

El avance detallado de los requerimientos se encuentra en [docs/ESTADO_REQUERIMIENTOS.md](docs/ESTADO_REQUERIMIENTOS.md).

## Pruebas

El backend incluye pruebas unitarias de reservas y pagos, además de una prueba de arranque con H2 en memoria. Se ejecutan desde `backend` con `mvn test` o directamente desde IntelliJ IDEA. Las pruebas nunca utilizan la base MySQL local.

> Los pagos con tarjeta son una simulación. El sistema no solicita ni almacena información bancaria real.

## Seguridad

No se deben subir contraseñas, secretos JWT ni archivos `application-local.properties`. Cada integrante debe mantener su propia configuración local.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
