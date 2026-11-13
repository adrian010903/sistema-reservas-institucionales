# CD controlado en Render

## Estado y límites

Los servicios actuales de Render asociados a `main` pueden desplegar automáticamente al recibir un merge. Este repositorio no cambia esa configuración externa. El workflow `CD staging (Render)` es **manual** y solo acepta ejecuciones desde `main`; no se ejecuta al abrir o fusionar un PR. No se debe usar con los IDs de los servicios de producción.

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

1. Espera a que CI, E2E y Docker estén verdes en el PR y que el cambio sea aprobado y fusionado en `main`.
2. En GitHub Actions, selecciona `CD staging (Render)` > `Run workflow` con la rama `main`.
3. El workflow despliega exactamente el commit de esa ejecución, primero en el backend y luego en el frontend. Espera el estado `live` de cada despliegue y comprueba `/api/v1/status` y `/login`.
4. Guarda el enlace del run, los IDs de despliegue y el resultado de la prueba de aceptación. Un estado `live` y las rutas accesibles no sustituyen la revisión funcional de staging.

Si falta una variable, el workflow falla antes de contactar Render. Si falla un despliegue o la comprobación de salud, se detiene y no anuncia staging como validado.

## Producción y rollback

**Este PR no automatiza producción.** Para cumplir el proyecto final, aún se deben configurar un environment `production` con *required reviewers* y prevención de autoaprobación, servicios separados y un workflow de producción sujeto a esa aprobación. Si los servicios de producción siguen con autodeploy desde `main`, un merge puede desplegar sin ese control: desactívalo antes de afirmar que producción requiere aprobación explícita.

Ante un fallo en staging, abre Render > servicio afectado > Deploys y usa `Rollback` sobre un despliegue exitoso anterior. Repite la verificación de salud y registra el incidente. Para producción, el rollback debe ser una operación autorizada y ensayada previamente; Render puede revertir a un build anterior retenido, pero la reversión no deshace migraciones de base de datos ni cambios externos. No hagas rollback de datos sin un plan específico. Documenta el commit y el despliegue al que se volvió, el motivo y el resultado.
