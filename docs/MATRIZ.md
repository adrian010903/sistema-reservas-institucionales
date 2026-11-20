# Matriz de cumplimiento

Relación entre los requisitos del enunciado del Proyecto Final y la evidencia de cada uno en el repositorio.

Repositorio: `adrian010903/sistema-reservas-institucionales` · Tablero Scrum: [GitHub Project](https://github.com/users/adrian010903/projects/1)

## Integración Continua (CI)

| Requisito | Evidencia |
|---|---|
| Ejecución automática en cada Pull Request | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| Checkout y build | Jobs *Backend tests* y *Frontend lint and build* de `ci.yml` |
| Pruebas unitarias | Job *Backend tests* · [PRUEBAS.md](PRUEBAS.md) |
| Análisis estático | Job *Backend Static Analysis* (SpotBugs y Find Security Bugs) |
| Pruebas de integración | Pruebas `*HttpIntegrationTest` · [PRUEBAS.md](PRUEBAS.md) |
| Pruebas E2E | [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) |
| Docker build | [`.github/workflows/docker.yml`](../.github/workflows/docker.yml) |
| Generación de artefactos | Artefactos `backend-build` y `backend-coverage-report` |
| Un fallo impide el merge | Ruleset de `main` con 5 checks requeridos |
| Ejecución en `main` | [CI](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44656657805) · [Docker](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44656657758) · [E2E](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44656657993) |

## Entrega y Despliegue Continuo (CD)

| Requisito | Evidencia |
|---|---|
| Desarrollo: despliegue automático al hacer merge a `main` | [`cd-desarrollo.yml`](../.github/workflows/cd-desarrollo.yml) · [CD_RENDER.md §4](CD_RENDER.md) |
| Staging: despliegue controlado | [`cd-staging.yml`](../.github/workflows/cd-staging.yml) · [CD_RENDER.md §5](CD_RENDER.md) |
| Producción: aprobación explícita | [`cd-produccion.yml`](../.github/workflows/cd-produccion.yml) · environment `production` protegido · [CD_RENDER.md §6](CD_RENDER.md) |
| Controles de producción | Ejecuciones [44210429508](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44210429508) y [44210880335](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44210880335) |
| Rollback | [CD_RENDER.md §7 y §8](CD_RENDER.md) · ensayo en staging: [44633714483](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44633714483) → [44634192352](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44634192352) → [E2E staging](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44634945297) |
| Pruebas de los scripts de CD | [`test-cd.yml`](../.github/workflows/test-cd.yml) · [CD_RENDER.md §9](CD_RENDER.md) |
| Blue/Green Deployment | [CD_RENDER.md §11](CD_RENDER.md) (análisis de viabilidad) |

## Gestión del código en GitHub

| Requisito | Evidencia |
|---|---|
| Feature Branch Workflow | [GUIA_CONTRIBUCION.md](GUIA_CONTRIBUCION.md) · historial de ramas y Pull Requests |
| Pull Requests obligatorios y sin push directo a `main` | Ruleset *Proteccion de main* |
| Code Review | Ruleset con al menos 1 aprobación requerida |
| Checks de CI antes del merge | Ruleset con 5 checks requeridos |

## Dockerización

| Requisito | Evidencia |
|---|---|
| Dockerfile | [`backend/Dockerfile`](../backend/Dockerfile) · [`frontend/Dockerfile`](../frontend/Dockerfile) |
| Docker Compose, variables de entorno y persistencia | [`compose.yaml`](../compose.yaml) |
| Instrucciones de ejecución | [README.md](../README.md) |
| Construcción de imágenes en CI | [`docker.yml`](../.github/workflows/docker.yml) |

## Pruebas automatizadas

| Requisito | Evidencia |
|---|---|
| Pruebas unitarias de componentes críticos | 60 pruebas unitarias · [PRUEBAS.md](PRUEBAS.md) |
| Pruebas de integración | 23 pruebas · [PRUEBAS.md](PRUEBAS.md) |
| Reporte de cobertura | JaCoCo: 72,9 % de líneas · artefacto `backend-coverage-report` |
| Pruebas E2E de los flujos principales | 4 escenarios con Playwright · [PRUEBAS.md](PRUEBAS.md) |
| E2E contra una instancia desplegada | [`e2e-staging.yml`](../.github/workflows/e2e-staging.yml) · [ejecución en staging](https://github.com/adrian010903/sistema-reservas-institucionales/actions/runs/44634945297) |
| Resultados registrados como evidencia | [PRUEBAS.md](PRUEBAS.md) (sección Resultados) |

## Herramienta de Troubleshooting

| Requisito | Evidencia |
|---|---|
| Monitoreo y alertas automáticas | Better Stack: monitores y alerta por correo · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Logs centralizados | Better Stack (Live tail) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Diagnóstico guiado y recomendaciones | Módulo *Administración > Diagnóstico* · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Histórico de incidentes | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) · [CD_RENDER.md §13](CD_RENDER.md) (INC-CD-01) |

## Scrum

| Requisito | Evidencia |
|---|---|
| Product Owner, Scrum Master y equipo | [SCRUM.md](SCRUM.md) |
| Product Backlog | [GitHub Project](https://github.com/users/adrian010903/projects/1) (45 historias de usuario) |
| Sprint Backlogs y Sprint Goals | [SCRUM.md](SCRUM.md) · README del Project |
| Incrementos | [SCRUM.md](SCRUM.md) |
| Definition of Done | [SCRUM.md](SCRUM.md) |
| Ceremonias | [SCRUM.md](SCRUM.md) (sección Ceremonias, con capturas en `docs/evidencias`) |

## Documentación

| Requisito | Evidencia |
|---|---|
| README | [README.md](../README.md) |
| Arquitectura | [ARQUITECTURA.md](ARQUITECTURA.md) |
| Guía de contribución | [GUIA_CONTRIBUCION.md](GUIA_CONTRIBUCION.md) |
| Manual de operación | [MANUAL_OPERACION.md](MANUAL_OPERACION.md) |
| Pruebas | [PRUEBAS.md](PRUEBAS.md) |
| CI/CD | [CD_RENDER.md](CD_RENDER.md) |
| Troubleshooting | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
