# CD controlado en Render

Este documento explica cómo se publica el sistema en Render, cómo verificar cada flujo y cómo recuperarse de un fallo. No contiene valores secretos: las claves, IDs y URL viven en los environments de GitHub y en Render.

## 1. Ambientes

| Ambiente | Propósito | Workflow | Cuándo se ejecuta | Control | Servicios de Render | Environment de GitHub |
|---|---|---|---|---|---|---|
| Desarrollo | Validación interna de cada merge | `CD desarrollo (Render)` (`cd-desarrollo.yml`) | Automático después de un merge a `main`, cuando `CI`, `Docker` y `E2E` del mismo commit terminaron con éxito | Los tres checks deben pasar | `reservas-backend-dev`, `reservas-frontend-dev` | `development` |
| Staging | Pruebas de aceptación antes de producción | `CD staging (Render)` (`cd-staging.yml`) | Manual (`Run workflow`) desde `main` o `feature/e2e-staging` | Ejecución manual y verificación de servicios | `reservas-backend-staging`, `reservas-frontend-staging` | `staging` |
| Producción | Uso real de Guías y Scouts | `CD producción (Render)` (`cd-produccion.yml`) | Manual (`Run workflow`), solo desde `main` | Confirmación `PRODUCCION` y aprobación del environment `production`; para `deploy`, además, checks en verde | `sistema-reservas-backend`, `sistema-reservas-institucionales` | `production` |

Cada ambiente usa servicios, base de datos y variables propios. Antes de tocar Render, cada workflow consulta la API y se detiene si el nombre exacto, la URL o el autodeploy del servicio no son los esperados; así un ID mal copiado no puede afectar otro ambiente. Todos los servicios deben tener el **autodeploy de Render apagado**, porque los despliegues los decide GitHub.

## 2. Estado: código integrado y despliegue probado

| Elemento | Código integrado en `main` | Despliegue probado | Evidencia |
|---|---|---|---|
| Desarrollo automático | Sí (PR #33) | **Sí** | Run que esperó checks pendientes: [44035342704](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44035342704). Run que desplegó backend y frontend: [44035523905](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44035523905) (commit `4a5b216`) |
| Desarrollo sin configuración | Sí | Sí, falló antes de desplegar | [44033843916](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44033843916): se detuvo en "Verificar configuración de desarrollo" (commit `64727f5`, antes de que existiera la configuración) |
| Staging (deploy y E2E) | Sí (PR #30–#32) | Sí | [E2E staging](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44000560355) |
| Rollback en staging | Sí | **Pendiente**: ensayo coordinado con Adrián (sección 8) | — |
| Producción con aprobación | Sí (PR #33 y #34) | **No ejecutado** por decisión del equipo | Validaciones cubiertas por pruebas automáticas (sección 9) |
| Rollback en producción | Sí (PR #34) | **No ejecutado** | Validaciones cubiertas por pruebas automáticas (sección 9) |
| Pruebas de los scripts de CD | Este PR | Se ejecutan en el workflow `Pruebas CD` | Artefacto `resultados-pruebas-cd` del run |

## 3. Variables por environment

Configurar en **GitHub > Settings > Environments**. Las URL van sin `/api/v1` y sin barra final. Ejemplos con valores ficticios:

| Environment | Tipo | Nombre | Ejemplo (ficticio) |
|---|---|---|---|
| `development` | Secret | `RENDER_API_KEY` | `rnd_xxxxxxxx` |
| `development` | Variable | `RENDER_DEV_BACKEND_SERVICE_ID` | `srv-xxxxxxxx` |
| `development` | Variable | `RENDER_DEV_FRONTEND_SERVICE_ID` | `srv-yyyyyyyy` |
| `development` | Variable | `RENDER_DEV_BACKEND_URL` | `https://reservas-backend-dev.onrender.com` |
| `development` | Variable | `RENDER_DEV_FRONTEND_URL` | `https://reservas-frontend-dev.onrender.com` |
| `staging` | Secret | `RENDER_API_KEY` | `rnd_xxxxxxxx` |
| `staging` | Variable | `RENDER_STAGING_BACKEND_SERVICE_ID`, `RENDER_STAGING_FRONTEND_SERVICE_ID` | `srv-...` |
| `staging` | Variable | `RENDER_STAGING_BACKEND_URL`, `RENDER_STAGING_FRONTEND_URL` | `https://...onrender.com` |
| `production` | Secret | `RENDER_API_KEY` | `rnd_xxxxxxxx` |
| `production` | Variable | `RENDER_PROD_BACKEND_SERVICE_ID`, `RENDER_PROD_FRONTEND_SERVICE_ID` | `srv-...` |
| `production` | Variable | `RENDER_PROD_BACKEND_URL`, `RENDER_PROD_FRONTEND_URL` | `https://...onrender.com` |

Protección del environment `production`: *Required reviewers* (Shirley o Dana), *Prevent self-review* y rama permitida `main`.

En cada servicio de Render se configuran además las variables de la aplicación (backend) y `VITE_API_URL` (frontend) de su propio ambiente, con su propia base de datos. Ningún ambiente comparte base de datos ni variables con producción.

## 4. Desarrollo: despliegue automático

`CD desarrollo (Render)` usa el disparador `workflow_run`: GitHub lo inicia cada vez que termina en `main` uno de los checks requeridos (`CI`, `Docker` o `E2E`). Por eso cada merge produce tres ejecuciones:

1. **Esperar checks requeridos** (sin secretos): continúa solo si el check que terminó salió bien, fue por un `push` (el merge de un PR) y en `main`. Con `checks.sh` consulta los tres checks del mismo commit:
   - alguno falló: el job falla con "Algún check falló; no se despliega";
   - alguno sigue en curso: termina sin desplegar ("Faltan checks por terminar") y el último check en terminar vuelve a iniciar el flujo;
   - los tres en `success`: pasa al siguiente job.
2. **Desplegar desarrollo**: `validar-config.sh development` comprueba que existan las cinco variables; `render.sh verificar` exige los nombres exactos `reservas-backend-dev` y `reservas-frontend-dev`, su URL y autodeploy apagado. Después despliega el commit exacto (`workflow_run.head_sha`): backend y `/api/v1/status`, luego frontend y `/login`.

**Cómo verificar:** en Actions > `CD desarrollo (Render)`, de las tres ejecuciones de un merge, dos deben mostrar el job de despliegue como *skipped* y una como *success*. Abrir la URL de desarrollo y comprobar `/login`.

GitHub solo ejecuta los workflows `workflow_run` que están en `main`; un cambio a este workflow se puede probar únicamente después de fusionarlo.

## 5. Staging: despliegue controlado

`cd-staging.yml` es independiente de desarrollo y producción: usa el environment `staging`, sus propias variables `RENDER_STAGING_*`, exige los nombres `reservas-backend-staging` y `reservas-frontend-staging` y no usa los scripts compartidos de `.github/scripts`. No se ha modificado desde el PR #31; los cambios de CD posteriores (PR #33, #34 y este) no lo tocan. Las rutas que comprueba siguen existiendo: `/api/v1/status` (`StatusController`, pública en `SecurityConfig`) y `/login` (ruta del frontend, servida por el `try_files ... /index.html` de `frontend/nginx.conf`).

**Desplegar staging:**

1. Esperar a que CI, Docker y E2E estén verdes en la rama que se va a probar.
2. Actions > `CD staging (Render)` > `Run workflow`, elegir `main` (o `feature/e2e-staging` para ensayos) y dejar `operation=deploy`.
3. El workflow verifica los servicios, despliega el commit en backend y frontend, espera `live` y comprueba `/api/v1/status` y que `/login` devuelva la página (`id="root"`).
4. Ejecutar **E2E staging** (`workflow_dispatch` desde `main`): registra un usuario temporal `@example.test`, inicia sesión, abre **Mis reservas**, recarga la ruta del catálogo y crea y cancela una reserva propia. No toca producción ni pagos reales.
5. Guardar el enlace del run, los IDs de despliegue y el resultado de E2E staging.

Un estado `live` y rutas accesibles no sustituyen la revisión funcional de staging.

## 6. Producción: despliegue con aprobación explícita

`CD producción (Render)` es manual y tiene dos jobs:

1. **Validar antes de pedir aprobación** (sin secretos): `validar-produccion.sh` exige ejecutar desde `main` y escribir `PRODUCCION`. Para `deploy` exige además `CI`, `Docker` y `E2E` en verde para el commit. Para `rollback` no exige esos checks (el rollback sirve para salir de una versión con fallos) y solo comprueba el formato `dep-...` del ID. Si algo falla, no se llega a pedir aprobación. `PRODUCCION` evita ejecuciones accidentales; **no reemplaza la aprobación**.
2. **Desplegar o revertir producción**: usa el environment `production`. GitHub pausa el job en *Waiting* hasta que un revisor lo apruebe. Solo entonces se leen los secretos, `validar-config.sh production` comprueba las variables y `render.sh verificar` exige exactamente `sistema-reservas-backend` y `sistema-reservas-institucionales`, su URL y autodeploy apagado.

**No se ha ejecutado ningún despliegue ni rollback a producción.**

## 7. Rollback y recuperación ante fallos

| Ambiente | Cómo volver a una versión estable |
|---|---|
| Desarrollo | Revertir el PR problemático en GitHub (`Revert`) y fusionarlo: los checks pasan y el workflow despliega la versión anterior. También puede usarse Render > servicio `-dev` > Deploys > `Rollback` (lo hace quien administra Render). |
| Staging | `CD staging (Render)` con `operation=rollback` (sección 8). |
| Producción | `CD producción (Render)` con `operation=rollback`, `rollback_service` y `rollback_deploy_id`. Requiere `PRODUCCION` y aprobación, pero no depende de los checks del commit actual. Después de la aprobación, `render.sh revertir` comprueba que el despliegue exista **en ese servicio** (si es de otro servicio, Render responde que no existe) y que haya sido exitoso (`live` o `deactivated`). |

Pasos ante un fallo después de desplegar:

1. **Detectar:** el workflow falla en la comprobación de salud, o el panel **Administración > Diagnóstico** / Better Stack muestra errores (ver `docs/TROUBLESHOOTING.md`).
2. **Elegir** en Render > servicio afectado > **Deploys** el último despliegue exitoso (`dep-...`, en estado `live` o `deactivated`).
3. **Revertir** con el flujo del ambiente y esperar a que el workflow confirme la salud.
4. **Registrar** el incidente: commit con fallo, despliegue al que se volvió, motivo, enlace del run y resultado.
5. **Corregir** en una rama `bugfix/...` o `hotfix/...` con su PR y volver a desplegar.

Render revierte el código y la configuración del build, pero **no** deshace cambios en la base de datos ni en servicios externos. El rollback por API tampoco apaga el autodeploy; por eso los workflows se niegan a continuar si está encendido.

## 8. Guion del ensayo de rollback (staging)

Se ejecuta **junto con Adrián**, en staging, nunca en producción. Para el primer ensayo se usa solo el **frontend** de staging, porque no afecta la base de datos.

**Antes de empezar**

1. Confirmar que staging está estable: último `CD staging (Render)` en verde y E2E staging en verde.
2. En Render > `reservas-frontend-staging` > **Deploys**, anotar:
   - el despliegue actual (`live`): será la "versión final" a la que se vuelve;
   - un despliegue anterior exitoso (`deactivated`): será el destino del rollback.
3. Confirmar que el servicio es `reservas-frontend-staging` y que su autodeploy está apagado.

**Ensayo**

4. Actions > `CD staging (Render)` > `Run workflow` desde `main`, con `operation=rollback`, `rollback_service=frontend` y el ID del despliegue anterior.
5. Esperar el resultado: el workflow verifica servicios, comprueba que el despliegue pertenezca al servicio y haya sido exitoso, pide el rollback, espera `live` y comprueba `/login`.
6. Abrir la URL de staging y comprobar que la aplicación carga. Opcional: ejecutar E2E staging.

**Volver a la versión final**

7. Ejecutar `CD staging (Render)` con `operation=deploy` desde `main`, esperar verde y ejecutar E2E staging.

**Evidencia a guardar**

| Dato | Valor |
|---|---|
| Fecha y participantes | |
| Servicio | `reservas-frontend-staging` |
| Despliegue de origen (versión final) | `dep-...` |
| Despliegue elegido para el rollback | `dep-...` |
| Nuevo despliegue creado por el rollback | `dep-...` |
| Run del rollback | enlace |
| Verificación de recuperación (`/login`, E2E) | resultado y captura |
| Run de vuelta a la versión final | enlace |

## 9. Pruebas automáticas de los scripts

El workflow `Pruebas CD` (`test-cd.yml`) se ejecuta en cada PR hacia `main` y en cada push a `main`, `feature/**` y `bugfix/**`. Revisa la sintaxis de todos los scripts y ejecuta tres simulacros que **no usan secretos, no llaman a Render ni a GitHub y no despliegan**: reemplazan `curl` y `gh` por versiones falsas que responden datos inventados. Guarda los resultados en el artefacto `resultados-pruebas-cd`.

| Archivo de prueba | Qué simula |
|---|---|
| `test-checks.sh` | Checks exitosos, uno fallido, uno en curso, uno sin ejecutar, fallo y pendiente a la vez y una re-ejecución |
| `test-render.sh` | Falta `RENDER_API_KEY`, comando desconocido, servicio correcto, nombre incorrecto, nombre con sufijo, URL distinta, ID inexistente, autodeploy encendido, despliegue `live`, build fallido, Render sin ID, salud correcta, error de salud, rollback con ID mal escrito, rollback a un despliegue fallido, rollback a un despliegue de otro servicio y rollback válido. Comprueba que en los rollbacks inválidos **no** se envíe ninguna petición `POST` y que la clave nunca se imprima |
| `test-validaciones.sh` | `validar-config.sh` (completa, falta la clave, falta una URL, sin variables, IDs iguales) y `validar-produccion.sh` (deploy con checks verdes, fallidos o pendientes; rollback con checks fallidos; ID mal escrito o vacío; sin `PRODUCCION`; rama distinta de `main`; operación desconocida) |

Para ejecutarlas localmente (requiere `bash` y `jq`):

```bash
bash .github/scripts/test-checks.sh
bash .github/scripts/test-render.sh
bash .github/scripts/test-validaciones.sh
```

## 10. Errores comunes

| Mensaje del workflow | Causa | Solución |
|---|---|---|
| `Falta configurar X en el environment Y de GitHub` | Variable o secret no creado en ese environment | Crearlo en Settings > Environments > Y |
| `Los servicios backend y frontend deben ser distintos` | Se copió el mismo ID en las dos variables | Corregir los IDs |
| `Render no encontró el servicio ...` | ID incorrecto o clave sin acceso | Revisar el ID en Render y la clave |
| `El servicio ... se llama '...' y no cumple la regla ...` | El ID es de otro ambiente | Usar el ID del servicio correcto |
| `... no coincide con la URL esperada o tiene el autodeploy encendido` | URL distinta o autodeploy activo | Corregir la URL (sin barra final) o apagar el autodeploy en Render |
| `El despliegue de X falló: build_failed` | Error al construir en Render | Revisar los logs del deploy en Render; corregir en un PR |
| `La comprobación de salud falló: ...` | El servicio quedó `live` pero no responde | Revisar logs y Diagnóstico; si es necesario, hacer rollback |
| `Algún check falló; no se despliega` (desarrollo) | CI, Docker o E2E falló en `main` | Corregir en un PR; el siguiente merge vuelve a desplegar |
| `El commit ... no tiene todos los checks en verde` (producción) | Se intentó publicar un commit sin checks completos | Esperar o corregir los checks |
| `Debes escribir PRODUCCION ...` | Confirmación vacía o mal escrita | Escribir `PRODUCCION` en mayúsculas |
| `Indica un ID de despliegue válido de Render (dep-...)` | ID de rollback vacío o mal copiado | Copiar el ID `dep-...` desde Render > Deploys |
| `El despliegue ... no existe en el servicio de ...` | El ID es de otro servicio | Copiar un despliegue del mismo servicio |
| `El despliegue elegido no es uno exitoso anterior ...` | El despliegue elegido había fallado | Elegir uno en estado `live` o `deactivated` |
| Job en *Waiting* | Espera la aprobación del environment `production` | Un revisor distinto de quien lo inició debe aprobarlo |

## 11. Blue/Green Deployment

Un Blue/Green completo mantiene dos copias de producción, despliega en la inactiva, la prueba y luego cambia todo el tráfico de una vez. Con nuestra configuración **no es viable**:

- Requiere duplicar los servicios de producción y un mecanismo para cambiar el tráfico entre ellos (balanceador o cambio de dominio), con costo y administración adicionales.
- Ambas copias compartirían la misma base de datos MySQL; un cambio de esquema afectaría a la copia anterior y el cambio de vuelta no sería seguro.

**Alternativa utilizada:** Render sustituye la versión anterior solo cuando la nueva queda `live`; los workflows comprueban la salud antes de dar el despliegue por bueno; si falla, se hace rollback a un despliegue anterior retenido por Render; y staging funciona como la copia donde se valida cada versión antes de producción.

## 12. Configuración externa (cuenta de Adrián)

**Hecho** (informado por Adrián):

- Servicios `reservas-backend-dev` y `reservas-frontend-dev` creados con autodeploy apagado.
- Environment `development` con `RENDER_API_KEY`, IDs y URL de ambos servicios.

**Pendiente de confirmar:**

1. Autodeploy **apagado** en `sistema-reservas-backend` y `sistema-reservas-institucionales`. Si sigue encendido, un merge a `main` publicaría en producción sin aprobación.
2. Environment `production` con *Required reviewers* (Shirley o Dana), *Prevent self-review*, rama permitida `main`, `RENDER_API_KEY` y las variables `RENDER_PROD_*`.
3. Base de datos de desarrollo aislada de producción.
4. Fecha y hora del ensayo de rollback en staging (sección 8).
5. Opcional: agregar `Pruebas CD / Simulacros de scripts de despliegue` a los checks requeridos de la protección de `main`.
