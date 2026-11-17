#!/usr/bin/env bash
# Comprueba que los checks requeridos (CI, Docker y E2E) pasaron para un commit.
# Lo usan cd-desarrollo.yml y cd-produccion.yml antes de desplegar.
# Requiere GH_TOKEN, GITHUB_REPOSITORY y las herramientas gh y jq.
#
# Uso: checks.sh <commit>
# Escribe en pantalla el estado de cada check y termina con:
#   0 si todos pasaron
#   1 si alguno falló
#   2 si alguno todavía no termina
set -euo pipefail

commit="$1"
requeridos=(CI Docker E2E)

# Ejecuciones de workflows para ese commit, provocadas por un push a main.
runs=$(gh api "repos/${GITHUB_REPOSITORY}/actions/runs?head_sha=${commit}&event=push&per_page=100" --jq '.workflow_runs')

resultado=0
for nombre in "${requeridos[@]}"; do
  # Si un workflow se re-ejecutó, vale la ejecución más reciente.
  estado=$(jq -r --arg n "$nombre" \
    '[.[] | select(.name == $n)] | sort_by(.created_at) | last | if . == null then "sin_ejecutar" elif .status != "completed" then "en_curso" else .conclusion end' \
    <<< "$runs")
  echo "${nombre}: ${estado}"
  case "$estado" in
    success) ;;
    en_curso|sin_ejecutar) [[ $resultado -eq 0 ]] && resultado=2 ;;
    *) resultado=1 ;;
  esac
done
exit "$resultado"
