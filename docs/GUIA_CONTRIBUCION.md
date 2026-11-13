# Guía de contribución

Esta guía describe el flujo esperado para modificar el repositorio. No cambia
por sí sola las reglas de protección configuradas en GitHub.

## 1. Preparar una rama

Actualiza `main` y crea una rama corta con un prefijo descriptivo:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/descripcion
```

Usa `feature/` para funciones, `bugfix/` para correcciones y `hotfix/` para
correcciones urgentes. No trabajes directamente en `main`.

## 2. Validar los cambios

Para el backend, desde `backend`:

```bash
./mvnw --batch-mode --no-transfer-progress verify
```

En Windows también se puede ejecutar `mvnw.cmd`. El ciclo `verify` ejecuta las
pruebas y genera el informe JaCoCo en `target/site/jacoco/`.

Para el frontend, desde `frontend`:

```bash
npm ci
npm run lint
npm run build
npm run test:e2e
```

Las pruebas E2E locales usan servicios de prueba; no deben apuntar a cuentas o
bases de datos de producción.

Para probar Compose de forma aislada, sigue la sección **Ejecución aislada con
Docker** del README. `docker compose down` conserva los datos; `docker compose
down -v` elimina los volúmenes y no debe usarse si se quieren conservar.

## 3. Abrir un Pull Request

Sube la rama y abre un Pull Request hacia `main`. Incluye:

- qué problema resuelve y qué cambió;
- las pruebas ejecutadas y su resultado;
- capturas si cambia la interfaz;
- variables nuevas, riesgos o pasos de configuración, sin valores secretos.

Espera que los checks obligatorios terminen correctamente. La especificación del
proyecto requiere revisión de otra persona antes del merge. Verifica en GitHub
que `main` exija Pull Request, revisión y checks; esta guía no confirma ni
configura esas opciones.

## 4. Seguridad y datos

- Nunca agregues `.env`, `application-local.properties`, tokens, contraseñas ni
  claves reales al repositorio.
- Usa cuentas y bases de datos de prueba en E2E; no ejecutes pruebas contra
  producción.
- No hagas push directo ni merge a `main` como parte de una prueba local.
- Los cambios de despliegue y recuperación se rigen por
  [CD_RENDER.md](CD_RENDER.md). El despliegue de producción requiere aprobación
  explícita y queda fuera de esta guía.
