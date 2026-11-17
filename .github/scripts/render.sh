#!/usr/bin/env bash
# Funciones para hablar con la API de Render desde los workflows de CD.
# Las usan cd-desarrollo.yml y cd-produccion.yml.
# Requiere la variable de entorno RENDER_API_KEY y las herramientas curl y jq.
#
# Uso:
#   render.sh verificar <service_id> <url_publica> <regla_nombre>
#   render.sh desplegar <service_id> <etiqueta> <commit>
#   render.sh desplegar_si_falta <service_id> <etiqueta> <commit>
#   render.sh revertir  <service_id> <etiqueta> <deploy_id_anterior>
#   render.sh salud     <url>
set -euo pipefail

API="https://api.render.com/v1"

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo "Falta RENDER_API_KEY"
  exit 1
fi

# Hace una consulta GET a Render y devuelve la respuesta en JSON.
render_get() {
  curl --fail-with-body --silent --show-error --retry 3 --retry-all-errors \
    "${API}$1" --header "Authorization: Bearer ${RENDER_API_KEY}"
}

# Hace una petición POST a Render con un cuerpo JSON.
render_post() {
  curl --fail-with-body --silent --show-error \
    --request POST "${API}$1" \
    --header "Authorization: Bearer ${RENDER_API_KEY}" \
    --header 'Content-Type: application/json' \
    --data "$2"
}

# Comprueba que el ID corresponde al servicio esperado antes de tocarlo:
# misma URL, autodeploy apagado y un nombre que cumpla la regla del ambiente.
# La regla es una expresión regular con el nombre exacto, por ejemplo
# '^reservas-backend-dev$'.
verificar() {
  local service_id="$1" url="$2" regla="$3" service nombre
  if ! service=$(render_get "/services/${service_id}"); then
    echo "Render no encontró el servicio ${service_id}: revisa el ID y que RENDER_API_KEY tenga acceso"
    exit 1
  fi
  nombre=$(jq -r '.name' <<< "$service")
  if [[ ! "$nombre" =~ $regla ]]; then
    echo "El servicio ${service_id} se llama '${nombre}' y no cumple la regla '${regla}'"
    exit 1
  fi
  if ! jq -e --arg id "$service_id" --arg url "${url%/}" \
    '.id == $id and (.serviceDetails.url | rtrimstr("/")) == $url and (.autoDeployTrigger == "off" or (.autoDeployTrigger == null and .autoDeploy == "no"))' \
    <<< "$service" > /dev/null; then
    echo "El servicio ${nombre} no coincide con la URL esperada o tiene el autodeploy encendido"
    exit 1
  fi
  echo "Servicio verificado: ${nombre}"
}

# Espera a que un despliegue termine. Devuelve 0 si queda live y 1 si falla.
esperar() {
  local service_id="$1" etiqueta="$2" deploy_id="$3" respuesta status
  for _ in {1..90}; do
    if ! respuesta=$(render_get "/services/${service_id}/deploys/${deploy_id}"); then
      echo "No se pudo consultar el estado del despliegue ${deploy_id} de ${etiqueta}"
      return 1
    fi
    status=$(jq -r '.status' <<< "$respuesta")
    case "$status" in
      live) echo "${etiqueta} está live (${deploy_id})"; return 0 ;;
      build_failed|update_failed|pre_deploy_failed|canceled|deactivated)
        echo "El despliegue de ${etiqueta} falló: ${status}"; return 1 ;;
    esac
    sleep 15
  done
  echo "Tiempo de espera agotado para ${etiqueta}"
  return 1
}

# Pide a Render desplegar exactamente un commit y espera el resultado.
desplegar() {
  local service_id="$1" etiqueta="$2" commit="$3" response deploy_id
  if ! response=$(render_post "/services/${service_id}/deploys" \
    "$(jq -n --arg commitId "$commit" '{commitId: $commitId}')"); then
    echo "Render rechazó la solicitud de despliegue de ${etiqueta}"
    exit 1
  fi
  deploy_id=$(jq -r '.id // empty' <<< "$response")
  if [[ -z "$deploy_id" ]]; then
    echo "Render no devolvió el ID del despliegue de ${etiqueta}"
    exit 1
  fi
  echo "Despliegue de ${etiqueta} iniciado: ${deploy_id} (commit ${commit})"
  esperar "$service_id" "$etiqueta" "$deploy_id"
}

# Despliega un commit solo si no es ya la versión live del servicio.
# Evita publicar dos veces lo mismo cuando dos checks terminan a la vez:
# las ejecuciones van en fila, así que la segunda encuentra el commit ya live.
# Si Render no devuelve la lista o el commit es otro, despliega normalmente.
desplegar_si_falta() {
  local service_id="$1" etiqueta="$2" commit="$3" lista ultimo_commit ultimo_estado
  if lista=$(render_get "/services/${service_id}/deploys?limit=1"); then
    ultimo_commit=$(jq -r 'first(.[].deploy.commit.id) // empty' <<< "$lista" 2>/dev/null || true)
    ultimo_estado=$(jq -r 'first(.[].deploy.status) // empty' <<< "$lista" 2>/dev/null || true)
    if [[ "$ultimo_commit" == "$commit" && "$ultimo_estado" == live ]]; then
      echo "${etiqueta} ya tiene live el commit ${commit}; no se repite el despliegue"
      return 0
    fi
  fi
  desplegar "$service_id" "$etiqueta" "$commit"
}

# Vuelve a un despliegue anterior que haya funcionado.
revertir() {
  local service_id="$1" etiqueta="$2" anterior="$3" objetivo estado response nuevo
  if [[ ! "$anterior" =~ ^dep-[a-zA-Z0-9]+$ ]]; then
    echo 'Indica un ID de despliegue válido de Render (dep-...)'
    exit 1
  fi
  # Si el despliegue no pertenece a este servicio, Render responde que no existe.
  if ! objetivo=$(render_get "/services/${service_id}/deploys/${anterior}"); then
    echo "El despliegue ${anterior} no existe en el servicio de ${etiqueta}"
    exit 1
  fi
  estado=$(jq -r '.status' <<< "$objetivo")
  if [[ "$estado" != live && "$estado" != deactivated ]]; then
    echo 'El despliegue elegido no es uno exitoso anterior de este servicio'
    exit 1
  fi
  if ! response=$(render_post "/services/${service_id}/rollback" \
    "$(jq -n --arg deployId "$anterior" '{deployId: $deployId}')"); then
    echo "Render rechazó la solicitud de rollback de ${etiqueta}"
    exit 1
  fi
  nuevo=$(jq -r '.id // empty' <<< "$response")
  if [[ -z "$nuevo" ]]; then
    echo 'Render no devolvió el ID del rollback'
    exit 1
  fi
  echo "Rollback de ${etiqueta} iniciado: ${nuevo} (vuelve a ${anterior})"
  esperar "$service_id" "$etiqueta" "$nuevo"
}

# Comprueba que una dirección responda sin error.
salud() {
  if ! curl --fail --silent --show-error --retry 5 --retry-delay 10 --retry-all-errors "$1" > /dev/null; then
    echo "La comprobación de salud falló: $1 no respondió correctamente"
    exit 1
  fi
  echo "Responde correctamente: $1"
}

comando="${1:-}"
shift || true
case "$comando" in
  verificar) verificar "$@" ;;
  desplegar) desplegar "$@" ;;
  desplegar_si_falta) desplegar_si_falta "$@" ;;
  revertir)  revertir "$@" ;;
  salud)     salud "$@" ;;
  *) echo "Comando desconocido: ${comando}"; exit 1 ;;
esac
