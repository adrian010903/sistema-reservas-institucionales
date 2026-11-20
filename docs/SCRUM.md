# Scrum en el proyecto

Este documento resume cómo se aplicó Scrum en el Sistema Integrado de Reservas Institucionales de Guías y Scouts de Costa Rica. El tablero completo está en el GitHub Project del repositorio.

## Roles

| Rol | Persona |
|---|---|
| Product Owner | Rafael Acevedo Madrigal |
| Scrum Master | Adrián Alonso Acevedo Madrigal |
| Equipo de desarrollo | Dana Paola Aguirre Espinoza, Alejandra Quintanilla Muñiz y Shirley Pérez Anchia |

## Product Backlog

El Product Backlog tiene **45 historias de usuario** organizadas en **8 épicas**, con un total de **167 Story Points**. Cada historia es un issue del repositorio (`HU-01` a `HU-45`) con su épica, prioridad, estimación y criterios de aceptación.

| Épica | Nombre |
|---|---|
| EP-01 | Gestión de usuarios y acceso |
| EP-02 | Gestión de espacios y zonas |
| EP-03 | Disponibilidad de espacios |
| EP-04 | Gestión de reservas |
| EP-05 | Gestión de tarifas, pagos y comprobantes |
| EP-06 | Notificaciones |
| EP-07 | Reportes y estadísticas |
| EP-08 | Bitácora y auditoría |

## Sprint Backlogs y Sprint Goals

| Sprint | Sprint Goal | Historias | SP | Estado |
|---|---|---|---|---|
| Sprint 1 | Establecer la base del sistema mediante la gestión de usuarios, acceso, roles y espacios institucionales. | HU-01, HU-02, HU-04, HU-05, HU-06, HU-07, HU-10, HU-11, HU-12, HU-13 | 32 | Completado |
| Sprint 2 | Completar funcionalidades pendientes de usuarios y espacios e implementar la consulta de disponibilidad y el proceso inicial de reservas. | HU-03, HU-09, HU-14, HU-15, HU-16, HU-17, HU-18, HU-19 | 35 | Completado |
| Sprint 3 | Completar la gestión de reservas e implementar las principales funcionalidades relacionadas con el registro, consulta y validación de pagos. | HU-08, HU-20, HU-21, HU-22, HU-23, HU-24, HU-26, HU-27 | 34 | Completado |
| Sprint 4 | Completar la gestión de pagos e incorporar notificaciones, reportes y estadísticas para finalizar la integración funcional del producto. | HU-25, HU-28, HU-29, HU-30, HU-31, HU-32, HU-33 | 32 | Completado |
| Sprint 5 | Incorporar las solicitudes institucionales de la Sprint Review del Sprint 3: camas y unidades del hostel, precios diferenciados, respaldo con QR o PDF, notificaciones a dos destinatarios y bitácora. | HU-34 a HU-45 | 34 | Pendiente |

### Ajustes al plan

- En el Sprint 1 se comprometieron 11 historias (34 SP). La HU-08 (bloqueo de usuarios) se trasladó al Sprint 3, por lo que el alcance final fue de 10 historias (32 SP).
- Las HU-34 a HU-45 surgieron en la Sprint Review del Sprint 3 (20/10/2026), a partir de las solicitudes de la representante institucional.

## Definition of Ready

Una historia de usuario está lista para entrar a un Sprint cuando:

1. Está redactada de forma clara e identifica el rol o usuario que requiere la funcionalidad.
2. Expresa el objetivo que se busca alcanzar.
3. Tiene criterios de aceptación definidos.
4. Tiene una prioridad asignada y una estimación en Story Points.
5. Las principales dudas fueron aclaradas con el Product Owner.
6. Se conocen sus dependencias con otras historias o funcionalidades.

## Definition of Done

Una historia de usuario se considera terminada cuando:

1. La funcionalidad fue desarrollada según lo establecido y cumple sus criterios de aceptación.
2. Aplica correctamente las validaciones y reglas de negocio relacionadas.
3. Fue probada y no presenta errores que impidan su uso.
4. Se integra adecuadamente con los demás componentes del sistema.
5. Los permisos según el rol del usuario funcionan correctamente, cuando corresponda.
6. La información se almacena o actualiza de forma adecuada.
7. La documentación necesaria está actualizada.
8. Está disponible para su revisión y validación con el Product Owner.

## Incrementos

| Sprint | Resultado |
|---|---|
| Sprint 1 | 10 de 10 historias del alcance final (100 %; 94,1 % del compromiso original). |
| Sprint 2 | 8 de 8 historias (100 %). |
| Sprint 3 | 8 de 8 historias (100 %). Se demostraron el 20/10/2026 sin fallos observados. |
| Sprint 4 | 7 de 7 historias (100 %). |

## Ceremonias

| Ceremonia | Sprint | Fecha | Medio | Evidencia |
|---|---|---|---|---|
| Daily Scrum | Sprint 1 | 10/09/2026 | | |
| Daily Scrum | Sprint 1 | 17/09/2026 | | |
| Sprint Review | Sprint 2 | | Videollamada con el Product Owner | |
| Sprint Review | Sprint 3 | 20/10/2026 | Google Meet | |
| Sprint Retrospective | Sprint 3 | 20/10/2026 | Google Meet | |

## Mejoras surgidas de las retrospectivas

| N.º | Acción | Origen |
|---|---|---|
| M1 | Conservar el historial con el estado INACTIVO en lugar de eliminar registros | Daily Scrum 10/09/2026, Sprint 1 |
| M2 | Revisar el Definition of Done antes del cierre del Sprint (caso HU-04 y HU-05) | Daily Scrum 17/09/2026, Sprint 1 |
| M3 | Trasladar la HU-08 (bloqueo de usuarios) al Sprint 3 | Sprint 1, ajuste de alcance de 34 a 32 SP |
| A2 | Redactar las nuevas solicitudes institucionales como historias de usuario (HU-34 a HU-45) | Sprint Retrospective del Sprint 3, 20/10/2026 |
