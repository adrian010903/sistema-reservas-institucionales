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

- Registro e inicio de sesión con roles.
- Catálogo público de espacios.
- Fotografías de espacios con validación de formato real, límite de tamaño y almacenamiento configurable.
- Creación y seguimiento de reservas.
- Consulta de disponibilidad por lugar, fecha, horario y capacidad.
- Modificación y cancelación de reservas activas.
- Validación del horario institucional de 08:00 a 17:00.
- Protección transaccional contra reservas o pagos simultáneos duplicados.
- Flujo de pagos demostrativo en colones costarricenses.
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

## Pruebas

El backend incluye pruebas unitarias de reservas, pagos, seguridad, recuperación, imágenes y reportes, además de una prueba de arranque con H2 en memoria. Se ejecutan desde `backend` con `mvn test` o directamente desde IntelliJ IDEA. Las pruebas nunca utilizan la base MySQL local.

Última verificación: 28 pruebas ejecutadas, sin fallos ni errores, con Java 17 y Spring Boot 4.1.0.

> Los pagos con tarjeta son una simulación. El sistema no solicita ni almacena información bancaria real.

## Seguridad

No se deben subir contraseñas, secretos JWT ni archivos `application-local.properties`. Cada integrante debe mantener su propia configuración local.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
