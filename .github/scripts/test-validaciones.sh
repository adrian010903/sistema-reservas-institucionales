#!/usr/bin/env bash
# Pruebas de validar-config.sh y validar-produccion.sh sin conectarse a GitHub.
# Reemplaza gh por uno falso que devuelve ejecuciones inventadas de CI, Docker y E2E.
#
# Uso: bash .github/scripts/test-validaciones.sh   (requiere bash y jq)
set -uo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
temporal="$(mktemp -d)"
trap 'rm -rf "$temporal"' EXIT
mkdir -p "$temporal/bin"

cat > "$temporal/bin/gh" <<'EOF'
#!/usr/bin/env bash
cat "$DATOS_FALSOS"
EOF
chmod +x "$temporal/bin/gh"

aprobadas=0
fallidas=0

# Compara el resultado (ok o error) de un comando con lo esperado.
comprobar() {
  local descripcion="$1" esperado="$2" codigo="$3" resultado
  if [[ $codigo -eq 0 ]]; then resultado=ok; else resultado=error; fi
  if [[ "$resultado" == "$esperado" ]] && ! grep -q 'secreto-de-prueba' "$temporal/salida.txt"; then
    echo "OK    ${descripcion} (${resultado}: $(tail -n 1 "$temporal/salida.txt"))"
    aprobadas=$((aprobadas + 1))
  else
    echo "FALLA ${descripcion}: se esperaba ${esperado} y salió ${resultado}"
    sed 's/^/      /' "$temporal/salida.txt"
    fallidas=$((fallidas + 1))
  fi
}

# --- validar-config.sh ---
config() {
  local descripcion="$1" esperado="$2"
  shift 2
  env -i PATH="$PATH" "$@" bash "$aqui/validar-config.sh" development > "$temporal/salida.txt" 2>&1
  comprobar "$descripcion" "$esperado" $?
}

completa=(RENDER_API_KEY=secreto-de-prueba BACKEND_SERVICE_ID=srv-b FRONTEND_SERVICE_ID=srv-f
          BACKEND_URL=https://b.example.test FRONTEND_URL=https://f.example.test)

echo '--- validar-config.sh'
config "Configuración completa" ok "${completa[@]}"
config "Falta RENDER_API_KEY" error "${completa[@]:1}"
config "Falta la URL del frontend" error "${completa[@]:0:4}"
config "No hay ninguna variable" error
config "Backend y frontend con el mismo ID" error "${completa[@]:0:2}" FRONTEND_SERVICE_ID=srv-b "${completa[@]:3}"

# --- validar-produccion.sh ---
run() {
  printf '{"name":"%s","status":"%s","conclusion":%s,"created_at":"2026-11-18T10:00:00Z"}' "$1" "$2" "$3"
}
verdes="$(run CI completed '"success"'),$(run Docker completed '"success"'),$(run E2E completed '"success"')"
rojo="$(run CI completed '"success"'),$(run Docker completed '"failure"'),$(run E2E completed '"success"')"
pendiente="$(run CI completed '"success"'),$(run Docker completed '"success"'),$(run E2E in_progress null)"

produccion() {
  local descripcion="$1" esperado="$2" ramas="$3" operacion="$4" confirmacion="$5" deploy_id="$6" checks="$7"
  printf '[%s]' "$checks" > "$temporal/runs.json"
  env -i PATH="$temporal/bin:$PATH" DATOS_FALSOS="$temporal/runs.json" GITHUB_REPOSITORY=equipo/repo \
    GITHUB_SHA=abc123 GITHUB_REF="$ramas" OPERACION="$operacion" CONFIRMACION="$confirmacion" \
    ROLLBACK_DEPLOY_ID="$deploy_id" bash "$aqui/validar-produccion.sh" > "$temporal/salida.txt" 2>&1
  comprobar "$descripcion" "$esperado" $?
}

MAIN=refs/heads/main
echo '--- validar-produccion.sh'
produccion "Deploy con checks en verde"            ok    $MAIN deploy PRODUCCION "" "$verdes"
produccion "Deploy con un check fallido"           error $MAIN deploy PRODUCCION "" "$rojo"
produccion "Deploy con un check pendiente"         error $MAIN deploy PRODUCCION "" "$pendiente"
produccion "Rollback con checks fallidos"          ok    $MAIN rollback PRODUCCION dep-abc123 "$rojo"
produccion "Rollback con ID mal escrito"           error $MAIN rollback PRODUCCION abc123 "$verdes"
produccion "Rollback sin ID"                       error $MAIN rollback PRODUCCION "" "$verdes"
produccion "Sin escribir PRODUCCION"               error $MAIN deploy produccion "" "$verdes"
produccion "Desde una rama distinta de main"       error refs/heads/feature/x deploy PRODUCCION "" "$verdes"
produccion "Operación desconocida"                 error $MAIN borrar PRODUCCION "" "$verdes"

echo
echo "Resultado: ${aprobadas} aprobadas, ${fallidas} fallidas"
[[ "$fallidas" -eq 0 ]]
