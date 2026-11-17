#!/usr/bin/env bash
# Validaciones de producción que se hacen ANTES de pedir la aprobación.
# Lo usa el job "Validar" de cd-produccion.yml. No usa secretos.
#
# Lee: GITHUB_REF, GITHUB_SHA, OPERACION (deploy o rollback),
#      CONFIRMACION y ROLLBACK_DEPLOY_ID.
# Para deploy necesita además GH_TOKEN y GITHUB_REPOSITORY (los usa checks.sh).
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"

if [[ "${GITHUB_REF:-}" != refs/heads/main ]]; then
  echo 'Producción solo se opera desde main'
  exit 1
fi

if [[ "${CONFIRMACION:-}" != PRODUCCION ]]; then
  echo 'Debes escribir PRODUCCION en el campo de confirmación'
  exit 1
fi

case "${OPERACION:-}" in
  deploy)
    # Publicar: exige que CI, Docker y E2E hayan pasado para este commit.
    if ! bash "$aqui/checks.sh" "$GITHUB_SHA"; then
      echo "El commit $GITHUB_SHA no tiene todos los checks en verde; no se puede llevar a producción"
      exit 1
    fi
    echo "Checks confirmados para $GITHUB_SHA"
    ;;
  rollback)
    # Rollback: no depende de los checks del commit actual, porque sirve
    # justamente para salir de una versión con fallos. Aquí solo se revisa
    # el formato del ID; después de la aprobación, render.sh comprueba que
    # pertenezca al servicio y que haya sido exitoso.
    if [[ ! "${ROLLBACK_DEPLOY_ID:-}" =~ ^dep-[a-zA-Z0-9]+$ ]]; then
      echo 'Indica un ID de despliegue válido de Render (dep-...)'
      exit 1
    fi
    echo "Rollback solicitado hacia $ROLLBACK_DEPLOY_ID; no se exigen los checks del commit actual"
    ;;
  *)
    echo "Operación desconocida: ${OPERACION:-vacía}"
    exit 1
    ;;
esac
