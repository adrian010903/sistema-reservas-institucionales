# CD controlado en Render

## Estado y límites

Los servicios actuales de Render asociados a `main` pueden desplegar automáticamente al recibir un merge. Este repositorio no cambia esa configuración externa. El workflow `CD staging (Render)` es **manual** y solo acepta ejecuciones desde `main` o `feature/e2e-staging`; no se ejecuta al abrir o fusionar un PR. Antes de modificar nada consulta la API de Render y exige nombres y URL exactos de los dos servicios de staging, además de autodeploy desactivado. No se debe usar con los IDs de los servicios de producción.

Antes de ejecutarlo, crea **dos servicios de staging distintos de producción** (backend y frontend), conectados a este repositorio y con despliegue automático desactivado. Aísla también la base de datos, las claves y cualquier integración externa. En GitHub, crea el environment `staging` y configura:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `RENDER_API_KEY` | Clave de API de Render con acceso a los servicios de staging |
| Variable | `RENDER_STAGING_BACKEND_SERVICE_ID` | ID del backend de staging |
| Variable | `RENDER_STAGING_FRONTEND_SERVICE_ID` | ID del frontend de staging |
| Variable | `RENDER_STAGING_BACKEND_URL` | URL pública del backend de staging, sin `/api/v1` |
| Variable | `RENDER_STAGING_FRONTEND_URL` | URL pública del frontend de staging |

No guardes la clave ni los IDs en el repositorio. Configura las variables de aplicación del backend y `VITE_API_URL` del frontend en los servicios de staging. Comprueba que ambos apunten a la base de datos y dominios de staging, nunca a producción.

## Ejecución y evidencia

1. Espera a que CI, E2E y Docker estén verdes en la rama que quieres probar. Para la entrega definitiva, el cambio debe aprobarse y fusionarse en `main`.
2. En GitHub Actions, selecciona `CD staging (Render)` > `Run workflow`, elige `main` o `feature/e2e-staging` y deja `operation=deploy`. La opción de la rama de staging sirve para ensayar el proceso sin fusionar a `main`.
3. El workflow despliega exactamente el commit de esa ejecución, primero en el backend y luego en el frontend. Espera el estado `live` de cada despliegue y comprueba `/api/v1/status` y `/login`.
4. Guarda el enlace del run, los IDs de despliegue y el resultado de la prueba de aceptación. Un estado `live` y las rutas accesibles no sustituyen la revisión funcional de staging.

### Prueba automatizada de staging

Después de que el despliegue de staging esté live, el workflow **E2E staging** puede ejecutarse manualmente desde `main` o automáticamente al subir cambios a `feature/e2e-staging`. Usa la URL `RENDER_STAGING_FRONTEND_URL` del entorno `staging`; no requiere la clave de Render. La prueba registra un usuario temporal con un correo `@example.test`, inicia sesión, abre **Mis reservas** y comprueba que la página sobrevive a una recarga. Cada ejecución crea una cuenta nueva en la base de datos de staging; no usa ni modifica producción. Guarda el run y su artefacto de resultados como evidencia. Los pagos no se prueban en este flujo.

Si falta una variable, el workflow falla antes de contactar Render. Si falla un despliegue o la comprobación de salud, se detiene y no anuncia staging como validado.

### Ensayo de rollback en staging

1. En Render > servicio de staging > **Deploys**, copia el ID (`dep-...`) de un despliegue anterior exitoso (puede figurar como `deactivated` tras ser reemplazado). Verifica que el servicio sea `reservas-frontend-staging` o `reservas-backend-staging`, nunca producción.
2. Ejecuta `CD staging (Render)` manualmente desde `feature/e2e-staging` o `main` con `operation=rollback`, selecciona `rollback_service` y pega `rollback_deploy_id`. Para el primer ensayo es más seguro usar solo el frontend de staging.
3. El workflow comprueba por API la identidad de ambos servicios, que el autodeploy esté apagado y que el despliegue elegido pertenezca al servicio y haya sido exitoso (`live` o `deactivated`). Después solicita el rollback, espera el nuevo despliegue y comprueba `/login` o `/api/v1/status` según corresponda.
4. Conserva el enlace del run, el ID de origen, el nuevo ID y la captura o resultado de una prueba funcional. Para volver a la versión más reciente, ejecuta de nuevo `operation=deploy` desde la rama correspondiente y verifica la aplicación.

El rollback por API **no** desactiva autodeploy; por eso el workflow se niega a continuar si está activado. Tampoco revierte datos, discos ni cambios externos. No hagas un ensayo con datos de producción.

## Producción y rollback

**Este PR no automatiza producción.** Para cumplir el proyecto final, aún se deben configurar un environment `production` con *required reviewers* y prevención de autoaprobación, servicios separados y un workflow de producción sujeto a esa aprobación. Si los servicios de producción siguen con autodeploy desde `main`, un merge puede desplegar sin ese control: desactívalo antes de afirmar que producción requiere aprobación explícita.

Ante un fallo en staging, usa el procedimiento anterior o abre Render > servicio afectado > Deploys y usa `Rollback` sobre un despliegue exitoso anterior. Repite la verificación de salud y registra el incidente. Para producción, el rollback debe ser una operación autorizada y ensayada previamente; Render puede revertir a un build anterior retenido, pero la reversión no deshace migraciones de base de datos ni cambios externos. No hagas rollback de datos sin un plan específico. Documenta el commit y el despliegue al que se volvió, el motivo y el resultado.
