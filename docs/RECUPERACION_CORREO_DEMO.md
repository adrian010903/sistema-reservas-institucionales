# Recuperación de contraseña por correo (demostración)

El flujo ya está conectado:

1. La persona selecciona **¿Olvidaste tu contraseña?** e ingresa su correo.
2. El backend crea un token de un solo uso que vence en 30 minutos.
3. Se envía un enlace para abrir la pantalla de nueva contraseña.
4. Al guardar la contraseña, el token se invalida y se cierran las sesiones anteriores.

## Configuración local

Copia `backend/src/main/resources/application-local.properties.example` como
`backend/src/main/resources/application-local.properties`. Este último archivo
está ignorado por Git y no se sube al repositorio.

Para Gmail, primero activen la verificación en dos pasos de la cuenta y creen
una **contraseña de aplicación**. Google indica que las contraseñas de
aplicación requieren verificación en dos pasos y son códigos de 16 caracteres.
No usen la contraseña habitual de Gmail. [Ayuda oficial de Google](https://support.google.com/accounts/answer/185833)

Agrega estos datos de la cuenta temporal que usarán en clase:

```properties
app.mail.enabled=true
app.mail.from=TU_CORREO@gmail.com
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=TU_CORREO@gmail.com
spring.mail.password=CLAVE_DE_APLICACION_DE_16_CARACTERES
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.frontend.url=http://localhost:5173
app.recovery.expose-token=false
```

Si van a exponer el frontend con Cloudflare, cambien `app.frontend.url` por la
URL `https://...trycloudflare.com` generada para la demostración. Reinicien el
backend después de guardar este archivo.

## Prueba rápida

1. Inicien backend y frontend.
2. Entren al inicio de sesión y pulsen **¿Olvidaste tu contraseña?**.
3. Escriban un correo que pertenezca a un usuario registrado.
4. Abran el enlace recibido, escriban la nueva contraseña y confirmen.
5. Inicien sesión con esa nueva contraseña.

Para una demo sin SMTP, dejen `app.mail.enabled=false` y
`app.recovery.expose-token=true`. El sistema mostrará el formulario de cambio
directamente, solo para desarrollo local.
