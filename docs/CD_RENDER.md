# CD controlado en Render

## Resumen de ambientes

| Ambiente | Workflow | Cuándo se ejecuta | Control | Servicios de Render |
|---|---|---|---|---|
| Desarrollo | `CD desarrollo (Render)` (`cd-desarrollo.yml`) | Automático después de un merge a `main`, cuando `CI`, `Docker` y `E2E` terminaron con éxito | Los tres checks deben pasar | `reservas-backend-dev`, `reservas-frontend-dev` |
| Staging | `CD staging (Render)` (`cd-staging.yml`) | Manual (`Run workflow`) | Ejecución manual y verificación de servicios | `reservas-backend-staging`, `reservas-frontend-staging` |
| Producción | `CD producción (Render)` (`cd-produccion.yml`) | Manual (`Run workflow`), solo desde `main` | Checks exitosos del commit, confirmación escrita y aprobación del environment `production` | Servicios originales conectados a `main` |

Los tres ambientes usan servicios distintos. Cada workflow consulta la API de Render antes de desplegar y se detiene si el nombre, la URL o el autodeploy del servicio no son los esperados, de modo que un ID mal copiado no puede tocar otro ambiente. Las funciones comunes de los workflows de desarrollo y producción están en `.github/scripts/render.sh` (verificar, desplegar, revertir y comprobar salud; el token solo se envía en la cabecera de autorización y nunca se imprime) y `.github/scripts/checks.sh` (comprueba que `CI`, `Docker` y `E2E` pasaron para un commit). `cd-staging.yml` conserva su lógica propia y no se modificó.

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

## Desarrollo: despliegue automático

`CD desarrollo (Render)` usa el disparador `workflow_run`: GitHub lo inicia cada vez que termina en `main` uno de los checks requeridos (`CI`, `Docker` o `E2E`). No se ejecuta en paralelo al merge, sino después de los checks:

1. El job **Esperar checks requeridos** continúa solo si el check que terminó salió bien, fue por un `push` (el merge de un PR) y en la rama `main`.
2. Con `checks.sh` consulta los tres checks del mismo commit. Si alguno falló, se detiene; si alguno sigue en curso, termina sin desplegar y el último check en terminar vuelve a iniciar el flujo.
3. Solo cuando los tres están en `success` se ejecuta el job **Desplegar desarrollo**, que es el único que lee los secretos.

El workflow despliega exactamente el commit que pasó los checks (`workflow_run.head_sha`): primero el backend y su `/api/v1/status`, después el frontend y su `/login`. Se ejecuta con el environment `development` y exige que los servicios se llamen `reservas-backend-dev` y `reservas-frontend-dev`, por lo que no puede apuntar a staging ni a producción.

GitHub solo ejecuta los workflows `workflow_run` que están en la rama principal; por eso este flujo empieza a funcionar después de fusionar el PR que lo agrega. Los servicios de desarrollo deben tener el autodeploy de Render **apagado**: si estuviera encendido, Render desplegaría el merge antes de que CI terminara.

## Producción: despliegue con aprobación explícita

`CD producción (Render)` es manual y tiene dos jobs:

1. **Validar** (sin acceso a secretos): exige ejecutar desde `main`, escribir `PRODUCCION` en el campo de confirmación y que el commit tenga `CI`, `Docker` y `E2E` en verde. Si algo falla, no se llega a pedir aprobación. La palabra `PRODUCCION` solo evita ejecuciones accidentales: **no reemplaza la aprobación** del revisor.
2. **Desplegar o revertir producción**: usa el environment `production`. Con *required reviewers* configurados, GitHub pausa el job en estado *Waiting* hasta que un revisor lo apruebe en Actions. Solo después se leen los secretos, se verifican los servicios y se despliega.

Revisora requerida propuesta: Shirley (si tiene permisos de colaboradora para aprobar; si no, Dana). Con *Prevent self-review* activado, la persona que inicia el workflow no puede aprobarlo.

Producción son los servicios originales de Render conectados a `main`. El workflow rechaza cualquier servicio cuyo nombre contenga `staging` o termine en `-dev`, y también los que tengan autodeploy encendido. Así, un merge a `main` no puede llegar a producción sin la aprobación.

**No se ha ejecutado ningún despliegue a producción.** El workflow queda preparado para cuando el equipo lo decida.

## Rollback y recuperación ante fallos

| Ambiente | Cómo volver a una versión estable |
|---|---|
| Desarrollo | Revertir el PR problemático en GitHub (`Revert`) y fusionarlo: CI pasa y el workflow despliega la versión anterior. |
| Staging | `CD staging (Render)` con `operation=rollback` (ver "Ensayo de rollback en staging"). |
| Producción | `CD producción (Render)` con `operation=rollback`, `rollback_service` y `rollback_deploy_id`. Requiere la misma confirmación y aprobación que un despliegue. |

Pasos ante un fallo después de desplegar:

1. Detectar: el workflow falla en la comprobación de salud o el panel **Administración > Diagnóstico** / Better Stack muestra errores (ver `docs/TROUBLESHOOTING.md`).
2. Elegir en Render > servicio afectado > **Deploys** el último despliegue exitoso (`dep-...`, en estado `live` o `deactivated`).
3. Ejecutar el rollback del ambiente correspondiente y esperar a que el workflow confirme la salud.
4. Registrar el incidente: commit con fallo, despliegue al que se volvió, motivo, enlace del run y resultado.
5. Corregir el error en una rama `bugfix/...` o `hotfix/...` con su PR y volver a desplegar.

Render revierte el código y la configuración del build, pero **no** deshace cambios en la base de datos ni en servicios externos. No se debe hacer rollback de datos sin un plan específico.

## Blue/Green Deployment

Un Blue/Green completo mantiene dos copias de producción (azul y verde), despliega la nueva versión en la copia inactiva, la prueba y luego cambia todo el tráfico de una vez. Con nuestra configuración **no es viable** por estos motivos:

- Requiere duplicar los servicios de producción y un mecanismo para cambiar el tráfico entre ellos (balanceador o cambio de dominio), con el costo y la administración adicional que eso implica.
- Ambas copias compartirían la misma base de datos MySQL, así que un cambio de esquema afectaría a la copia anterior y el cambio de vuelta no sería seguro.

**Alternativa utilizada:** el despliegue de Render sustituye la versión anterior solo cuando la nueva queda `live`, y los workflows comprueban la salud (`/api/v1/status` y `/login`) antes de dar el despliegue por bueno. Si la nueva versión falla, se usa el rollback a un despliegue anterior retenido por Render. Además, staging funciona como la copia donde se valida cada versión antes de llevarla a producción.

## Configuración externa pendiente (responsable: Adrián)

Nada de esto se guarda en el repositorio.

**Render**

1. Revisar si el plan de Render permite mantener activos servicios adicionales y, si es así, crear `reservas-backend-dev` y `reservas-frontend-dev`, conectados a este repositorio, con **autodeploy apagado** y una base de datos aislada. No deben compartir base de datos ni variables con producción.
2. **Apagar el autodeploy de los servicios originales (producción)** antes de considerar listo el flujo, y copiar sus IDs y URL a las variables del environment `production`.
3. Configurar en cada servicio nuevo las variables de la aplicación (backend) y `VITE_API_URL` (frontend).

**GitHub > Settings > Environments**

| Environment | Protección | Secret | Variables |
|---|---|---|---|
| `development` | Ninguna (se despliega solo si CI pasa) | `RENDER_API_KEY` | `RENDER_DEV_BACKEND_SERVICE_ID`, `RENDER_DEV_FRONTEND_SERVICE_ID`, `RENDER_DEV_BACKEND_URL`, `RENDER_DEV_FRONTEND_URL` |
| `production` | *Required reviewers* (Shirley o Dana), *Prevent self-review* y rama permitida `main` | `RENDER_API_KEY` | `RENDER_PROD_BACKEND_SERVICE_ID`, `RENDER_PROD_FRONTEND_SERVICE_ID`, `RENDER_PROD_BACKEND_URL`, `RENDER_PROD_FRONTEND_URL` |

Las URL van sin `/api/v1` y sin barra final.

## Evidencia de ejecuciones

Completar con los enlaces de GitHub Actions a medida que se ejecuten:

| Prueba | Resultado esperado | Enlace del run | Fecha |
|---|---|---|---|
| CI del PR de CD | CI en verde | Pendiente | |
| Despliegue automático a desarrollo tras el merge | Backend y frontend `live` | Pendiente | |
| Despliegue a desarrollo con un check fallido | El job de despliegue no se ejecuta | Pendiente | |
| Producción sin escribir `PRODUCCION` | Falla en "Validar" sin pedir aprobación | Pendiente | |
| Producción pausada en *Waiting* | Muestra la solicitud de aprobación (se cancela sin desplegar) | Pendiente | |
| Ensayo de rollback en staging (con Adrián, hora por coordinar cuando staging esté estable) | Rollback `live` y `/login` responde | Pendiente | |
