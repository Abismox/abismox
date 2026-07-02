#!/usr/bin/env bash
# ============================================
# ABISMOX // deploy.sh (VPS mínimo)
# Solo fetch de RSS + IA -> data/noticias.json -> push
# El render de HTML lo hace GitHub Action (.github/workflows/render.yml)
# ============================================
set -euo pipefail

cd "$(dirname "$0")"

# Saneamiento: si quedo un rebase en curso de una corrida interrumpida,
# lo abortamos antes de empezar uno nuevo.
git rebase --abort 2>/dev/null || true

# --- Cargar secrets ---
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
else
    echo "[ERROR] No existe .env. Crea uno desde .env.example" >&2
    exit 1
fi

: "${GH_TOKEN:?GH_TOKEN requerido en .env}"
: "${GITHUB_REPO:?GITHUB_REPO requerido en .env (formato: usuario/repo)}"
: "${MINIMAX_API_KEY:?MINIMAX_API_KEY requerido en .env}"

LOG_FILE="$(pwd)/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# --- Sync con origin (solo avance rapido, sin mezclar) ---
log "Sync con origin (git pull --ff-only)..."
if ! git pull --ff-only origin main 2>>"$LOG_FILE"; then
    log "WARN: No se pudo hacer ff-only (probable divergencia). Saltando este ciclo."
    log "      Desde Windows, haz 'git pull --rebase', luego intenta de nuevo."
    exit 0
fi
log "Sync OK"

log "=== INICIO FETCH ==="

# --- 1. Fetch de RSS + llamada a IA (escribe data/noticias.json) ---
log "Ejecutando build.py --only-fetch..."
if ! python3 build.py --only-fetch 2>>"$LOG_FILE"; then
    log "ERROR: build.py --only-fetch fallo. Abortando push."
    exit 1
fi
log "build.py OK"

# --- 2. Stage SOLO el JSON ---
git add data/noticias.json 2>/dev/null || true

# Si no hay cambios, salir limpio
if git diff --cached --quiet; then
    log "Sin noticias nuevas. Nada que pushear."
    log "=== FETCH COMPLETADO (sin cambios) ==="
    exit 0
fi

# --- 3. Commit + Push ---
COMMIT_MSG="auto: fetch noticias $(date '+%Y-%m-%d %H:%M')"
log "Commit: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" >>"$LOG_FILE" 2>&1

PUSH_URL="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPO}.git"
log "Push a ${GITHUB_REPO}..."
if git push "$PUSH_URL" main >>"$LOG_FILE" 2>&1; then
    log "Push OK. GitHub Action regenerara HTML en ~30s."
else
    log "ERROR: git push fallo. Revisa $LOG_FILE"
    exit 1
fi

log "=== FETCH COMPLETADO ==="