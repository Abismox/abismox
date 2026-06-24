#!/usr/bin/env bash
# ============================================
# ABISMOX // deploy.sh
# Build + git push a GitHub Pages
# ============================================
set -euo pipefail

cd "$(dirname "$0")"

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

LOG_FILE="$(pwd)/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== INICIO DEPLOY ==="

# --- 1. Build ---
log "Ejecutando build.py..."
if ! python3 build.py 2>>"$LOG_FILE"; then
    log "ERROR: build.py falló. Abortando push."
    exit 1
fi
log "build.py OK"

# --- 2. Stage ---
git add data/ posts/ feed.xml sitemap.xml robots.txt build.py deploy.sh .env.example 2>/dev/null || true

# Si no hay cambios, salir limpio
if git diff --cached --quiet; then
    log "Sin cambios. Nada que pushear."
    log "=== DEPLOY COMPLETADO (sin cambios) ==="
    exit 0
fi

# --- 3. Commit + Push ---
COMMIT_MSG="auto-update: $(date '+%Y-%m-%d %H:%M') [skip ci]"
log "Commit: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" >>"$LOG_FILE" 2>&1

PUSH_URL="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPO}.git"
log "Push a ${GITHUB_REPO}..."
if git push "$PUSH_URL" main >>"$LOG_FILE" 2>&1; then
    log "Push OK. GitHub Pages redesplegará en ~30s."
else
    log "ERROR: git push falló. Revisa $LOG_FILE"
    exit 1
fi

log "=== DEPLOY COMPLETADO ==="