#!/usr/bin/env bash
# Pruebas de checks.sh sin conectarse a GitHub.
# Reemplaza el comando gh por uno falso que devuelve ejecuciones inventadas
# y comprueba que checks.sh decide bien en cada caso.
#
# Uso: bash .github/scripts/test-checks.sh   (requiere bash y jq)
set -uo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
temporal="$(mktemp -d)"
trap 'rm -rf "$temporal"' EXIT

# gh falso: imprime el contenido del archivo indicado en DATOS_FALSOS.
cat > "$temporal/gh" <<'EOF'
#!/usr/bin/env bash
cat "$DATOS_FALSOS"
EOF
chmod +x "$temporal/gh"

# Crea una ejecución inventada: nombre, estado, conclusión y fecha.
run() {
  printf '{"name":"%s","status":"%s","conclusion":%s,"created_at":"%s"}' "$1" "$2" "$3" "$4"
}

aprobadas=0
fallidas=0

# Ejecuta checks.sh con unas ejecuciones inventadas y compara el código de salida.
probar() {
  local descripcion="$1" esperado="$2" datos="$3" obtenido
  printf '[%s]' "$datos" > "$temporal/runs.json"
  DATOS_FALSOS="$temporal/runs.json" PATH="$temporal:$PATH" GITHUB_REPOSITORY=equipo/repo \
    bash "$aqui/checks.sh" abc123 > "$temporal/salida.txt" 2>&1
  obtenido=$?
  if [[ "$obtenido" == "$esperado" ]]; then
    echo "OK    ${descripcion} (código ${obtenido})"
    aprobadas=$((aprobadas + 1))
  else
    echo "FALLA ${descripcion}: se esperaba ${esperado} y salió ${obtenido}"
    sed 's/^/      /' "$temporal/salida.txt"
    fallidas=$((fallidas + 1))
  fi
}

T1=2026-11-17T10:00:00Z
T2=2026-11-17T11:00:00Z

probar "Los tres checks exitosos" 0 \
  "$(run CI completed '"success"' $T1),$(run Docker completed '"success"' $T1),$(run E2E completed '"success"' $T1)"

probar "Un check fallido (Docker)" 1 \
  "$(run CI completed '"success"' $T1),$(run Docker completed '"failure"' $T1),$(run E2E completed '"success"' $T1)"

probar "Un check pendiente (E2E en curso)" 2 \
  "$(run CI completed '"success"' $T1),$(run Docker completed '"success"' $T1),$(run E2E in_progress null $T1)"

probar "Un check que todavía no aparece (E2E)" 2 \
  "$(run CI completed '"success"' $T1),$(run Docker completed '"success"' $T1)"

probar "Fallido y pendiente a la vez: gana el fallo" 1 \
  "$(run CI completed '"failure"' $T1),$(run Docker completed '"success"' $T1),$(run E2E in_progress null $T1)"

probar "Re-ejecución: vale la más reciente (falló y luego pasó)" 0 \
  "$(run CI completed '"failure"' $T1),$(run CI completed '"success"' $T2),$(run Docker completed '"success"' $T1),$(run E2E completed '"success"' $T1)"

echo
echo "Resultado: ${aprobadas} aprobadas, ${fallidas} fallidas"
[[ "$fallidas" -eq 0 ]]
