#!/usr/bin/env bash
# Pruebas de render.sh sin conectarse a Render ni desplegar nada.
# Reemplaza curl por uno falso que responde con datos inventados y anota
# cada llamada, para comprobar que render.sh se detiene cuando debe y que
# no pide despliegues ni rollbacks en los casos inválidos.
#
# Uso: bash .github/scripts/test-render.sh   (requiere bash y jq)
set -uo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
temporal="$(mktemp -d)"
trap 'rm -rf "$temporal"' EXIT
mkdir -p "$temporal/bin"

# curl falso. Responde según la ruta de la API de Render:
#   GET  /services/<id>                 -> servicio-<id>.json
#   GET  /services/<id>/deploys?limit=1 -> lista-<id>.json
#   GET  /services/<id>/deploys/<dep>   -> deploy-<id>-<dep>.json
#   POST /services/<id>/deploys         -> nuevo-deploy.json
#   POST /services/<id>/rollback        -> nuevo-rollback.json
# Si el archivo no existe responde 404 (código 22, como curl --fail).
# Cualquier otra URL es una comprobación de salud: usa el código del archivo "salud".
cat > "$temporal/bin/curl" <<'EOF'
#!/usr/bin/env bash
metodo=GET
url=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --request) metodo="$2"; shift 2 ;;
    --header|--data|--retry|--retry-delay) shift 2 ;;
    http*) url="$1"; shift ;;
    *) shift ;;
  esac
done
echo "$metodo $url" >> "$FALSO/llamadas.log"
ruta="${url#https://api.render.com/v1}"
if [[ "$ruta" == "$url" ]]; then
  exit "$(cat "$FALSO/salud" 2>/dev/null || echo 0)"
fi
ruta="${ruta%%\?*}"
IFS=/ read -r _ _ servicio parte deploy <<< "$ruta"
case "$metodo:$parte" in
  GET:)        archivo="servicio-${servicio}.json" ;;
  GET:deploys) if [[ -z "$deploy" ]]; then archivo="lista-${servicio}.json"; else archivo="deploy-${servicio}-${deploy}.json"; fi ;;
  POST:deploys) archivo="nuevo-deploy.json" ;;
  POST:rollback) archivo="nuevo-rollback.json" ;;
  *) archivo="" ;;
esac
if [[ -n "$archivo" && -f "$FALSO/$archivo" ]]; then
  cat "$FALSO/$archivo"
else
  echo '{"message":"not found"}'
  exit 22
fi
EOF
chmod +x "$temporal/bin/curl"

aprobadas=0
fallidas=0

# Prepara un escenario vacío para cada prueba.
nuevo_escenario() {
  rm -rf "$temporal/falso"
  mkdir -p "$temporal/falso"
  : > "$temporal/falso/llamadas.log"
}

# Escribe un archivo de respuesta del Render falso.
responder() {
  printf '%s' "$2" > "$temporal/falso/$1"
}

# Servicio inventado: id, nombre, url y autodeploy.
servicio() {
  printf '{"id":"%s","name":"%s","autoDeployTrigger":"%s","serviceDetails":{"url":"%s"}}' "$1" "$2" "$4" "$3"
}

# Ejecuta render.sh y compara el resultado.
#   esperado: "ok" (termina bien) o "error" (se detiene)
#   prohibido: texto que NO debe aparecer en las llamadas (por ejemplo "POST")
probar() {
  local descripcion="$1" esperado="$2" prohibido="$3"
  shift 3
  local codigo resultado
  FALSO="$temporal/falso" PATH="$temporal/bin:$PATH" RENDER_API_KEY="${CLAVE_FALSA-clave-falsa}" \
    bash "$aqui/render.sh" "$@" > "$temporal/salida.txt" 2>&1
  codigo=$?
  if [[ $codigo -eq 0 ]]; then resultado=ok; else resultado=error; fi
  if [[ "$resultado" != "$esperado" ]]; then
    echo "FALLA ${descripcion}: se esperaba ${esperado} y salió ${resultado} (código ${codigo})"
    sed 's/^/      /' "$temporal/salida.txt"
    fallidas=$((fallidas + 1))
  elif [[ -n "$prohibido" ]] && grep -q "$prohibido" "$temporal/falso/llamadas.log"; then
    echo "FALLA ${descripcion}: hizo una llamada prohibida (${prohibido})"
    sed 's/^/      /' "$temporal/falso/llamadas.log"
    fallidas=$((fallidas + 1))
  elif grep -q 'clave-falsa' "$temporal/salida.txt"; then
    echo "FALLA ${descripcion}: imprimió la clave de Render"
    fallidas=$((fallidas + 1))
  else
    echo "OK    ${descripcion} (${resultado}: $(tail -n 1 "$temporal/salida.txt"))"
    aprobadas=$((aprobadas + 1))
  fi
}

URL=https://reservas-backend-dev.onrender.com

echo '--- Configuración'
nuevo_escenario
CLAVE_FALSA='' probar "Falta RENDER_API_KEY" error "" verificar srv-dev "$URL" '^reservas-backend-dev$'
probar "Comando desconocido" error "" borrar-todo

echo '--- Verificar servicio'
nuevo_escenario
responder servicio-srv-dev.json "$(servicio srv-dev reservas-backend-dev "$URL" off)"
probar "Servicio correcto" ok "" verificar srv-dev "$URL" '^reservas-backend-dev$'
probar "URL con barra final también es válida" ok "" verificar srv-dev "$URL/" '^reservas-backend-dev$'
probar "Nombre de servicio incorrecto (staging)" error "" verificar srv-dev "$URL" '^reservas-backend-staging$'
probar "Nombre exacto: no acepta sufijos" error "" verificar srv-dev "$URL" '^reservas-backend$'
probar "URL distinta a la configurada" error "" verificar srv-dev https://otro.onrender.com '^reservas-backend-dev$'
probar "ID de servicio inexistente" error "" verificar srv-no-existe "$URL" '^reservas-backend-dev$'
nuevo_escenario
responder servicio-srv-dev.json "$(servicio srv-dev reservas-backend-dev "$URL" commit)"
probar "Autodeploy encendido" error "" verificar srv-dev "$URL" '^reservas-backend-dev$'

echo '--- Desplegar'
nuevo_escenario
responder nuevo-deploy.json '{"id":"dep-nuevo1"}'
responder deploy-srv-dev-dep-nuevo1.json '{"id":"dep-nuevo1","status":"live"}'
probar "Despliegue que queda live" ok "" desplegar srv-dev backend abc123
nuevo_escenario
responder nuevo-deploy.json '{"id":"dep-nuevo1"}'
responder deploy-srv-dev-dep-nuevo1.json '{"id":"dep-nuevo1","status":"build_failed"}'
probar "Despliegue con build fallido" error "" desplegar srv-dev backend abc123
nuevo_escenario
responder nuevo-deploy.json '{"message":"sin id"}'
probar "Render no devuelve ID de despliegue" error "" desplegar srv-dev backend abc123

echo '--- Evitar publicar dos veces lo mismo (desarrollo)'
ultimo() {
  printf '[{"deploy":{"id":"dep-ultimo","status":"%s","commit":{"id":"%s"}}}]' "$1" "$2"
}
nuevo_escenario
responder lista-srv-dev.json "$(ultimo live abc123)"
probar "El mismo commit ya está live: no despliega otra vez" ok POST desplegar_si_falta srv-dev backend abc123
nuevo_escenario
responder lista-srv-dev.json "$(ultimo live viejo999)"
responder nuevo-deploy.json '{"id":"dep-nuevo1"}'
responder deploy-srv-dev-dep-nuevo1.json '{"id":"dep-nuevo1","status":"live"}'
probar "Hay otro commit live: sí despliega" ok "" desplegar_si_falta srv-dev backend abc123
grep -q POST "$temporal/falso/llamadas.log" || { echo "FALLA no pidió el despliegue del commit nuevo"; fallidas=$((fallidas + 1)); }
nuevo_escenario
responder lista-srv-dev.json "$(ultimo build_failed abc123)"
responder nuevo-deploy.json '{"id":"dep-nuevo1"}'
responder deploy-srv-dev-dep-nuevo1.json '{"id":"dep-nuevo1","status":"live"}'
probar "El mismo commit había fallado: lo vuelve a intentar" ok "" desplegar_si_falta srv-dev backend abc123
grep -q POST "$temporal/falso/llamadas.log" || { echo "FALLA no reintentó el despliegue"; fallidas=$((fallidas + 1)); }
nuevo_escenario
responder nuevo-deploy.json '{"id":"dep-nuevo1"}'
responder deploy-srv-dev-dep-nuevo1.json '{"id":"dep-nuevo1","status":"live"}'
probar "Render no devuelve la lista: despliega normalmente" ok "" desplegar_si_falta srv-dev backend abc123

echo '--- Comprobación de salud'
nuevo_escenario
echo 0 > "$temporal/falso/salud"
probar "La página responde" ok "" salud "$URL/api/v1/status"
echo 22 > "$temporal/falso/salud"
probar "La página no responde (error de salud)" error "" salud "$URL/api/v1/status"

echo '--- Rollback'
nuevo_escenario
responder deploy-srv-dev-dep-viejo1.json '{"id":"dep-viejo1","status":"deactivated"}'
responder deploy-srv-dev-dep-roto1.json '{"id":"dep-roto1","status":"build_failed"}'
responder nuevo-rollback.json '{"id":"dep-rollback1"}'
responder deploy-srv-dev-dep-rollback1.json '{"id":"dep-rollback1","status":"live"}'
probar "Rollback con ID mal escrito" error POST revertir srv-dev backend viejo1
probar "Rollback a un despliegue que falló" error POST revertir srv-dev backend dep-roto1
probar "Rollback a un despliegue de otro servicio" error POST revertir srv-dev backend dep-deotro1
probar "Rollback válido a un despliegue anterior exitoso" ok "" revertir srv-dev backend dep-viejo1

echo
echo "Resultado: ${aprobadas} aprobadas, ${fallidas} fallidas"
[[ "$fallidas" -eq 0 ]]
