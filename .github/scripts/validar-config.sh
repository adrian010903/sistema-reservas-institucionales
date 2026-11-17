#!/usr/bin/env bash
# Comprueba que un environment de GitHub tenga toda la configuración de Render
# antes de contactar Render. Lo usan cd-desarrollo.yml y cd-produccion.yml.
#
# Uso: validar-config.sh <nombre-del-environment>
# Lee: RENDER_API_KEY, BACKEND_SERVICE_ID, FRONTEND_SERVICE_ID, BACKEND_URL y FRONTEND_URL.
# Nunca imprime sus valores: solo dice cuáles faltan.
set -euo pipefail

ambiente="${1:?Indica el nombre del environment}"
requeridas=(RENDER_API_KEY BACKEND_SERVICE_ID FRONTEND_SERVICE_ID BACKEND_URL FRONTEND_URL)

faltan=0
for nombre in "${requeridas[@]}"; do
  if [[ -z "${!nombre:-}" ]]; then
    echo "Falta configurar ${nombre} en el environment ${ambiente} de GitHub"
    faltan=1
  fi
done
if [[ "$faltan" -ne 0 ]]; then
  exit 1
fi

if [[ "$BACKEND_SERVICE_ID" == "$FRONTEND_SERVICE_ID" ]]; then
  echo 'Los servicios backend y frontend deben ser distintos'
  exit 1
fi

echo "Configuración completa para ${ambiente}"
