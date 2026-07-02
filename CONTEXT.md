# CONTEXT // ABISMOX

Estado completo del proyecto al cierre de la sesión **2026-07-02** (sesión de fix de slug + git workflow + test end-to-end de arquitectura nueva).
Referencia rápida para retomar trabajo en cualquier momento.

---

## 👤 Usuario

- **GitHub username:** `Abismox`
- **Email git:** `erickabismo@gmail.com`
- **Ubicación:** Guanajuato, México (UTC-6, sin DST desde 2022)
- **PC local:** Windows (PowerShell), repo en `C:\OpenCode_P\Blogx`
- **Hosting frontend:** GitHub Pages (gratis)
- **Hosting backend:** VPS Vultr (✅ ACTIVO desde 2026-06-24)

---

## 🌐 URLs activas

| Recurso | URL |
|---|---|
| Repo | https://github.com/Abismox/abismox |
| Sitio en vivo | https://Abismox.github.io/abismox/ |
| Feed RSS | https://Abismox.github.io/abismox/feed.xml |
| Sitemap | https://Abismox.github.io/abismox/sitemap.xml |
| Robots | https://Abismox.github.io/abismox/robots.txt |
| Actions (deploys) | https://github.com/Abismox/abismox/actions |
| Settings/Pages | https://github.com/Abismox/abismox/settings/pages |
| VPS (Vultr) | `45.76.29.64` (root por contraseña del email) |

---

## 🏗️ Arquitectura (ACTIVA)

```
[VPS Vultr · cron diario 00:00 (medianoche) hora Guanajuato]
   45.76.29.64 · Ubuntu 26.04 LTS · /opt/abismox
        ↓
   /opt/abismox/deploy.sh
   ├─ python3 build.py
   │   ├─ Lee RSS de 4 fuentes (vandal, 3djuegos, xataka, muycomputer)
   │   ├─ Llama API minimax (https://api.minimax.io/v1) → genera JSON
   │   └─ Renderiza posts/, feed.xml, sitemap.xml, robots.txt
   ├─ git add + commit ("auto-update: FECHA [skip ci]")
   └─ git push https://x-access-token:$GH_TOKEN@github.com/Abismox/abismox.git
        ↓
   [GitHub: Abismox/abismox] (recibe commit)
        ↓
   [GitHub Pages · CDN Fastly · deploy ~30s + caché 5-10min]
        ↓
   [Visitantes → Abismox.github.io/abismox/]
```

**Estado actual:** ✅ Desplegado y funcional, 16 noticias en producción.

---

## 📦 Versión actual: v2.1.0 (con automatización VPS v1.2.0-oficial)

### Commits relevantes
- `d807009` — Sitio original v1.0.0
- `328c65d` — feat: v1.1.0 (RSS, sitemap, search, share, OG, posts individuales)
- `0274732` — chore: re-trigger Pages deploy
- `398d981` — docs: add CONTEXT.md
- `5c6668a` — auto: chmod deploy.sh (primer deploy en VPS, sin datos nuevos)
- `a1980de` — auto: fix RSS feeds (vandal/3djuegos/xataka/muycomputer)
- `d2902ba` — auto: primer build exitoso (8 posts nuevos, total 16)
- `c641492` — fix: deploy.sh hace pull --rebase antes de push (auto-sync)
- `e83a298` — auto-update: 2026-06-25 11:26 (test cron, 29 posts)
- `d7e0e56` — feat: cap hibrido (30 posts / 30 dias) para evitar crecimiento infinito
- `4cb0bfb` — feat: v2.0 cartridge carousel - fase 1 (home)
- `cdc2d23` — feat: v2.0 polish - transiciones featured + swipe hint + kbd helper
- `ac9ecdf` — feat: v2.0 posts individuales con cartridge visual
- `0505050` — feat: v2.1.0 polish + fix post-hero sin cartucho (8 mejoras + sanitizer)
- `fb1ffa3` — fix: cerrar javascript: XSS, JSON-LD breakout y path traversal via slug
- `a9556f8` — fix(deploy): abortar rebase en curso al inicio para ser idempotente
- `c8baa0d` — feat(architecture): separar fetch (VPS) y render (GitHub Action)
- `457f379` — auto: fetch noticias 03:35 (VPS — primer test arquitectura nueva)
- `fdf9a61` — auto: render posts 09:35:29Z (Action — primer render bajo arquitectura)
- `ba91d61` — docs: CONTEXT actualizado (cierre sesión security)
- `9d0bf5c` — fix(build): blacklist slug placeholders + title-derivation + URL default

### Features implementadas (v2.1.0) — sesión 2026-07-01
**8 mejoras visuales en home:**
- ✅ Boot sequence CRT (flash + scaleY 0→80 en 600ms con overlay full-screen)
- ✅ Glitch RGB al cambiar cartucho (text-shadow cyan/magenta con steps animation 280ms)
- ✅ Panel tearing sutil (clip-path inset en cambios de featured)
- ✅ Fondo grid retro (linear-gradient 48px magenta+cyan) + vignette global
- ✅ Stars layer (60 puntos blancos con twinkle random via CSS vars)
- ✅ Scan-line animado (línea cyan barriendo CRT cada 4s)
- ✅ Aurora gradient en featured panel (background 300% con animation 8s)
- ✅ Loading "MEMORY CHECK" tipo BIOS (7 mensajes secuenciales con colores semánticos)

**Micro-interacciones:**
- ✅ Hover 3D tilt en cartuchos (rotateX/rotateY según mouse position)
- ✅ Sound effects opcionales (Web Audio API: boot/click/insert/filter con toggle en topbar)
- ✅ Counter animado 0→N (cubic ease-out con text-shadow verde durante animación)
- ✅ Tooltips 8-bit en elementos con data-tip (bubble pixel-style con blink 2s)
- ✅ prefers-reduced-motion respetado en boot, tilt, aurora, scan-line

**Post-hero rediseñado (FIX CRÍTICO):**
- ❌ REMOVIDO: cartucho mini en hero del post (era redundante con el home)
- ❌ REMOVIDO: watermark decorativo (bug CSS + redundancia)
- ✅ NUEVO: info-bar limpia (eyebrow "● NOW READING" + badge + título + meta + línea gradient animada)
- ✅ Borde lateral 6px color de categoría + dashed border-bottom morado
- ✅ Background radial-gradient con color de categoría (12% intensidad esquina)

**Defensa sistémica en `build.py`:**
- ✅ Nueva función `sanitize_post_html()` ejecuta al final de cada render
- ✅ Strip automático de cualquier `post-cartridge`, `post-cartridge-watermark`, `post-hero-flex`, `post-hero-text`, `cartridge post-cartridge__mini`
- ✅ Garantiza que NINGÚN post (actual o futuro) tenga el cartucho redundante, aunque el template se corrompa

**Funcionalidades v2.0 preservadas:**
- Cartridge carousel home con featured panel, IntersectionObserver, flechas, dots, swipe hint, kbd helper
- Posts individuales con cartridge visual en hero (ahora REEMPLAZADO por info-bar)
- OG tags + Twitter Card en home y posts
- JSON-LD `WebSite` en home + `BlogPosting` en cada post
- Sitemap.xml + robots.txt + RSS feed.xml
- Búsqueda en vivo con debounce 150ms
- Atajos teclado: `/` enfoca búsqueda, `Esc` limpia, `◄ ►` navegan cartuchos
- Botón compartir con Web Share API + fallback Twitter Intent
- Reading time estimado por cartridge
- Skip-link accesible + breadcrumb + sticky header
- Botón SOUND en topbar con persistencia localStorage (`abismox_sound`)
- Tooltips data-tip en topbar, filtros y cartuchos
- Auto-refresh 5min en home
- `.nojekyll` para desactivar Jekyll

### Estado del sitio (sesión 2026-07-01)
- ✅ v2.1.0 deployed via commit `0505050` pusheado a main
- ✅ GitHub Pages redespliega automáticamente (~30s después del push)
- ✅ 23 posts regenerados con info-bar limpia (sin cartucho)
- ✅ 8 mejoras visuales activas en home
- ✅ VPS cron diario 00:00 hora Guanajuato regenera desde nuevo template
- ✅ Sanitizer defensivo garantiza que el cartucho no vuelva a aparecer

### Decisiones de la sesión 2026-07-01
- Adoptado: 8 mejoras de diseño como v2.1.0
- Adoptado: rediseño post-hero con info-bar (cartucho eliminado del post)
- Adoptado: sanitizer defensivo en `build.py` (post-process anti-cartucho)
- Decisión de diseño (justificada por skill `frontend-design`): "Cut any decoration that does not serve the brief" — el cartucho en el post no servía a la lectura, era redundante con el home

---

## 📁 Estructura del VPS

```
/opt/abismox/
├── build.py              ← generador estático
├── deploy.sh             ← ejecutable (chmod +x)
├── template_post.html
├── generate_assets.py
├── index.html
├── style.css
├── main.js
├── snake.js
├── favicon.ico
├── og-image.png
├── .env                  ← credenciales (NO en git, recomendado chmod 600)
├── .env.example          ← template
├── data/
│   └── noticias.json     ← 16 entries (8 manuales + 8 auto)
├── posts/                ← 16 HTML individuales
│   └── ⚠️ kebab-case.html ← BUG: slug placeholder
├── feed.xml              ← RSS 2.0 con 16 items
├── sitemap.xml           ← 17 URLs
├── robots.txt
├── .nojekyll
├── .git/                 ← repo clonado de origin
├── CONTEXT.md
├── README.md
└── deploy.log            ← log acumulado de cada deploy
```

---

## 🔧 Detalles técnicos clave

### `build.py` (versión en VPS, idéntica a la del repo)
- URL de API: lee de `MINIMAX_BASE_URL` env var (default hardcodeado: `https://api.minimax.chat/v1` ❌ **ESTO ESTÁ MAL EN EL CÓDIGO**)
- **Fix aplicado vía `.env`**: `MINIMAX_BASE_URL=https://api.minimax.io/v1` ✅
- **Pendiente**: editar `build.py` línea ~212 para cambiar el default al correcto (Option B del plan)
- Model: `MiniMax-Text-01`, temperature 0.4, max_tokens 600
- Fuentes RSS (en `FUENTES_RSS`, **REEMPLAZADAS en esta sesión**):

```python
FUENTES_RSS = [
    ("https://vandal.elespanol.com/rss", "videojuegos"),         # NUEVO
    ("https://www.3djuegos.com/rss/juegos/", "videojuegos"),     # NUEVO
    ("https://www.xataka.com/feedburner.xml", "tecnologia"),     # NUEVO
    ("https://www.muycomputer.com/feed/", "tecnologia"),         # NUEVO
]
# ELIMINADAS (todas 404): eurogamer.es, IGN Feedburner, hackplayers, genbeta
```

### `.env` del VPS (en `/opt/abismox/.env`)

```bash
MINIMAX_API_KEY=<oculto>
GH_TOKEN=<PAT GitHub, scope repo, no expiration>
GITHUB_REPO=Abismox/abismox
MINIMAX_BASE_URL=https://api.minimax.io/v1   # ← FIX CRÍTICO
```

### `deploy.sh` (en `/opt/abismox/deploy.sh`)
- Ejecutable: `-rwxr-xr-x` ✅
- Carga `.env` automáticamente (`source .env`)
- Requiere `GH_TOKEN` y `GITHUB_REPO` (falla con `:?` si faltan)
- Hace `git add data/ posts/ feed.xml sitemap.xml robots.txt build.py deploy.sh .env.example`
- Commit message: `auto-update: YYYY-MM-DD HH:MM [skip ci]`
- Push URL: `https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPO}.git`

### Git config global (VPS)
- `user.name=Abismox`
- `user.email=erickabismo@gmail.com`
- `init.defaultBranch=main`
- `pull.rebase=false`

### Zona horaria VPS
- `America/Mexico_City` (UTC-6, equivalente a Guanajuato)
- Configurado con `timedatectl set-timezone America/Mexico_City`

### Cron configurado
- **Línea**: `0 8 * * * /opt/abismox/deploy.sh >> /opt/abismox/deploy.log 2>&1`
- **Hora**: 08:00 hora Guanajuato (todos los días)
- **⚠️ ESTADO**: Configuración pendiente de verificar al inicio de próxima sesión

---

## 🎨 Diseño (v2.1.0)

- **Estética:** retro N64/PS1 pixel art + CRT + arcade
- **Tipografías:** Press Start 2P (titulos + eyebrows + badges), VT323 (cuerpo)
- **Colores:** magenta `#FF1493`, cyan `#00FFFF`, verde `#00FF00`, naranja `#FF8C00`, morado `#7B2CBF`, rojo `#FF0000`
- **Animaciones clave:** boot sequence (600ms CRT power-on), glitch RGB (280ms), panel tearing, stars twinkle (CSS vars random), aurora gradient (8s loop), scan-line CRT (4s sweep), 3D tilt (mouse follow), MEMORY CHECK BIOS loading
- **Micro-interacciones:** counter animado (cubic ease-out), tooltips 8-bit, sound effects opcionales (Web Audio API)
- **Layout:** mobile-first, 1 col móvil → 2 cols tablet (≥600px) → 3 cols desktop (≥900px)
- **Post hero:** info-bar limpia (eyebrow + badge + título + meta + línea gradient), sin cartucho redundante con el home

---

## 🐛 Issues conocidos / aprendizaje

### Bug: `posts/kebab-case.html`
- **Síntoma**: en cada deploy aparecía un post con slug literal `kebab-case`
- **Causa**: el prompt en `build.py` línea ~297 contenía `"slug": "kebab-case"` como ejemplo; minimax "echeaba" el ejemplo en vez de generar uno real, y a veces omitía el slug por completo (entrada Assassin's Creed → dropeada silenciosamente por `validar_noticia`)
- **Fix aplicado (commit `9d0bf5c`)**:
  - Prompt ejemplo cambiado a `"slug": "titulo-de-la-noticia"` (consistente con título `"TITULO DE LA NOTICIA"`)
  - Nueva constante `_SLUG_PLACEHOLDERS` (frozenset de 10 placeholders: `kebab-case`, `titulo-de-la-noticia`, `titulo-en-mayusculas`, `ejemplo`, `ejemplo-noticia`, `ejemplo-noticia-2024`, `placeholder`, `muestra`, `slug-ejemplo`, `post-ejemplo`)
  - `validar_noticia` re-escrito: si slug falta o es placeholder, deriva del título con `_sanitizar_slug(titulo)` (no dropea la noticia)
- **Cleanup automático**: el loop de huérfanos en `render_posts` elimina `kebab-case.html` en el próximo `--only-render` (cuando el slug del JSON se normalice)
- **Estado**: fix pusheado a origin (`9d0bf5c` tras rebase — el original local era `ca9bbc3`); pendiente verificar desaparición de `kebab-case.html` después del próximo render

### Cache CDN de GitHub Pages
- **Síntoma**: sitio sirve versión vieja tras deploy
- **Workaround**: esperar 5-10 min para que Fastly propague; en local usar `Ctrl+F5` o incógnito

### URL incorrecta en `build.py` por defecto
- **Síntoma**: 401 "invalid api key (2049)" en TODAS las llamadas a la API
- **Causa**: default hardcodeado `https://api.minimax.chat/v1` no existe o no es el endpoint real
- **Endpoint real**: `https://api.minimax.io/v1`
- **Fix aplicado vía `.env`** (Opción A, 2026-06-24): `MINIMAX_BASE_URL=https://api.minimax.io/v1`
- **Fix aplicado en código** (Opción B, commit `9d0bf5c` 2026-07-02): default en `build.py` ahora es `api.minimax.io`. `.env.example` actualizado. Ya no depende del `.env` para funcionar.

### Histórico de debugging (2026-06-24)
1. Primer deploy (22:20): build OK pero RSS muertos → 0 items, sitio sin cambios
2. Reemplazo de feeds RSS → 76 items collected, pero minimax 401 (todos los modelos probados)
3. Diagnóstico con curl a 4 URLs candidatas → **api.minimax.io es la correcta**
4. Añadido `MINIMAX_BASE_URL=https://api.minimax.io/v1` al `.env` → deploy exitoso, 16 noticias en producción

### CRLF en Windows
- Git avisa: "LF will be replaced by CRLF"
- **Solución:** inofensivo, ignorar warning o añadir `.gitattributes` con `* text=auto eol=lf`

### GitHub Pages deploy puede fallar transitoriamente con "Deployment failed, try again later."
- **Síntoma**: workflow `pages-build-deployment` muestra "Failure" aunque `actions/deploy-pages@v5` reporta artifact built OK (303KB). Log de deploy step: stuck en `deployment_queued` (~20 polls), pasa a `syncing_files`, después `Error: Deployment failed, try again later.`
- **Causa**: problema de **infraestructura de Pages** (cola o servicio de sync), NO del código ni del artifact
- **Workaround**: re-correr el workflow desde la UI (`Actions` → click en el run → `Re-run failed jobs`). En nuestro caso el retry tomó 17s (vs 2m 52s del fallido).
- **Observado**: 2026-07-02 en `pages-build-deployment #32` (render commit `aeafa70`)
- **Decisión**: no requiere cambio de código; si vuelve a pasar en próximos deploys, simplemente re-run

---

## 🛠️ Workflow de git (local Windows)

**Problema recurrente:** el VPS cron 00:00 + GitHub Action pushean 2 commits al main durante el día. Cuando local trabaja y luego hace `git push`, sale error `fetch first` porque origin/main está adelante.

**Solución aplicada (2026-07-02, local Windows):**

```powershell
# Alias global que hace pull --rebase + push en un solo comando
git config --global alias.gpush '!f(){ b=$(git rev-parse --abbrev-ref HEAD); git pull --rebase origin "$b" && git push; }; f'

# Por si alguna vez se usa `git pull` a secas, que también rebase
git config --global pull.rebase true
```

**Uso nuevo:**
| Antes ❌ | Ahora ✅ |
|---|---|
| `git push` → "fetch first" | `git gpush` → siempre funciona |
| `git pull` (rare merge commits) | `git pull` → rebase silencioso |

**Verificar config:**
```powershell
git config --global --get-regexp "alias.gpush|pull.rebase"
```
Esperado: imprime ambas líneas (`alias.gpush !f(){...}` y `pull.rebase true`).

**Scope:** los configs son globales (afectan todos los repos del usuario en esta PC). Configurado solo en local Windows — VPS usa su propio `git config --local` (`pull.rebase=false` allí, porque `deploy.sh` ya hace el `--ff-only` antes del push).

**Recuperación si algo se complica (raro):**
```powershell
git rebase --abort 2>$null      # si quedó rebase a medias
git pull --rebase origin main   # forzar rebase limpio
# Si conflicto en archivos que TÚ no modificas (data/noticias.json, posts/, feed.xml):
#   es propiedad del VPS/Action, aceptar versión de origin: git checkout --theirs <file>; git add <file>; git rebase --continue
git push
```

**Respaldo manual si `gpush` falla:** usar `git pull --rebase && git push` (el original).

---

## 📋 Pendientes (futuras sesiones)

### Corto plazo
- [x] **Verificar que el cron esté configurado** — ✅ `0 0 * * *` confirmado
- [x] **Verificar primer cron automático** — ✅ Probado a las 11:25 con `25 11 * * *`, funcionó end-to-end
- [x] **Aplicar Option B**: editar `build.py` línea ~212, cambiar default `api.minimax.chat` → `api.minimax.io` — ✅ commit `9d0bf5c`
- [x] **Fix bug `kebab-case.html`**: prompt slug + blacklist + title-derivation — ✅ commit `9d0bf5c`
- [x] **Sincronizar cambios en local Windows con VPS** — ✅ Vía `git pull --rebase` desde local
- [x] **Push los commits pendientes a GitHub** — ✅ `9d0bf5c` pusheado (incluye rebase que cambió SHA de `ca9bbc3` → `9d0bf5c`)
- [x] **Setup `gpush` alias + `pull.rebase=true`** — ✅ Config global aplicada (2026-07-02)
- [ ] **Verificar que `kebab-case.html` desaparece tras próximo `--only-render`** — pendiente, será automático
- [ ] **Verificar que la entrada Assassin's Creed genera URL con slug derivado del título** (no kebab-case) — pendiente tras próximo render
- [ ] **Considerar post-procesar títulos** para corregir typos como "ASASSIN'S" (debería ser "ASSASSIN'S") — no crítico

### Seguridad (recomendable pero no urgente)
- [ ] `chmod 600 /opt/abismox/.env` (solo root puede leer)
- [ ] Configurar SSH key y desactivar login por contraseña en Vultr
- [x] **Rotar PAT de GitHub** — ✅ Hecho el 2026-06-25 (token viejo expuesto en chat)
- [x] **Quitar token del `.git/config` del VPS** — ✅ Con `git remote set-url origin https://github.com/...`

### Features opcionales (no comprometidas)
- [x] **Cap de posts** — ✅ Patrón C híbrido (30 posts / 30 días) implementado en `build.py`
- [ ] Dark/light toggle
- [ ] Tags múltiples por noticia
- [ ] Paginación (ya no urgente por el cap)
- [ ] Google Analytics / Plausible
- [ ] Custom domain (CNAME)
- [ ] Sistema de comentarios (giscus)
- [ ] Newsletter (Buttondown)
- [ ] Internacionalización (i18n EN/ES)
- [ ] Mejorar og-image.png para v2.0.0 (mostrar cartuchos)

---

## 💬 Cómo retomar mañana

**Opción A — Rápida (recomendada):**
> "Hola, sigamos con ABISMOX. Lee CONTEXT.md"

**Opción B — Con verificación:**
> "Hola, ¿el cron corrió esta mañana? Quiero [X cosa]"

**Opción C — Emergía:**
> Solo abre el proyecto y dime qué quieres hacer.

---

## 📝 Notas de la sesión 2026-06-24 (deploy automatizado)

### Logros
- ✅ VPS Vultr Ubuntu 26.04 LTS desplegado (Chicago, $5/mes, IP 45.76.29.64)
- ✅ Repo clonado en `/opt/abismox`
- ✅ Python 3 + pip + git + nano + curl instalados
- ✅ Zona horaria configurada a `America/Mexico_City`
- ✅ `.env` con API key de minimax + GH_TOKEN + GITHUB_REPO + MINIMAX_BASE_URL
- ✅ Git config global (user.name + user.email)
- ✅ `deploy.sh` ejecutable
- ✅ RSS feeds reemplazados (vandal, 3djuegos, xataka, muycomputer)
- ✅ Descubierto el endpoint correcto de minimax (api.minimax.io, no api.minimax.chat)
- ✅ Primer deploy automático completo: 8 posts nuevos generados por IA, total 16
- ✅ Push a GitHub OK, sitio actualizado

### Diagnóstico memorable (4 URLs probadas con curl)
| URL | Resultado |
|---|---|
| `api.minimaxi.com/v1/chat/completions` | 401 invalid key |
| `api.minimaxi.com/v1/text/chatcompletion` | 200 con body auth error (formato viejo) |
| **`api.minimax.io/v1/chat/completions`** | **✅ 200 OK con respuesta real de MiniMax AI** |
| `api.minimax.chat/v1/chat/completions` (en build.py) | 401 invalid key |

### Decisiones de la sesión
- Mantener anónimo/automático (sin "About" personal)
- Stack: 100% vanilla JS + Python build + GitHub Pages + Vultr VPS
- Frecuencia: 1 build diario (cron 08:00 hora Guanajuato)
- Decisión estética: sin imágenes por ahora, OG image fija
- El usuario prefiere respuestas concisas en español
- El usuario ejecuta pasos manuales en PowerShell y SSH (no bash local)
- **El usuario reveló que su "MiniMax Coding Plan" es el mismo que usa opencode → conclusión: opencode usa proxy, la API key directa SÍ funciona para llamadas a api.minimax.io**
- Se eligió **Opción A** para el fix de URL (`.env` en lugar de editar `build.py`) por ser menos invasivo

---

## 📝 Notas de la sesión 2026-06-25 (cron + cap + seguridad)

### Logros
- ✅ Cron diario configurado y validado a las **00:00 hora Guanajuato** (originalmente 08:00, cambiado por preferencia)
- ✅ **Fix arquitectónico clave** en `deploy.sh`: `git pull --rebase origin main` ANTES del build
  - Soluciona el "fetch first" error para siempre
  - VPS se auto-sincroniza con GitHub antes de cada deploy
  - Permite commits desde local Windows sin causar divergencia
- ✅ Cap híbrido implementado en `build.py` (Patrón C: 30 posts / 30 días)
  - Función `aplicar_cap()` añadida
  - Constantes `MAX_POSTS=30` y `MAX_DAYS=30`
  - Posts huérfanos se eliminan automáticamente
- ✅ Test de cron en vivo a las 11:25 con `25 11 * * *` → **funcionó perfecto**
  - 29 posts después del test (de 20 a 29 en una corrida)
- ✅ Seguridad:
  - Token PAT de GitHub **rotado** (viejo expuesto en chat)
  - `.git/config` del VPS **limpio** (URL sin token)
  - `deploy.sh` sigue usando x-access-token URL (de `.env`)
- ✅ Vultr billing verificado: ~$5-6/mes base + ~$0.20 extras (snapshots). Total esperado <$7/mes
- ✅ Local Windows sincronizado con VPS vía `git pull --rebase`

### Commits de la sesión
- `c641492` — fix: deploy.sh hace pull --rebase antes de push (auto-sync)
- `e83a298` — auto-update: 2026-06-25 11:26 (test cron, 29 posts)
- `d7e0e56` — feat: cap híbrido (30 posts / 30 días)
- `d7e0e56` (rebased) — docs: este CONTEXT.md actualizado

### Lecciones / descubrimientos
1. **PowerShell no acepta `&&`** entre comandos: usar punto-y-coma o ejecutar separados
2. **"Never used" en tokens de GitHub tiene delay** de horas/días — no es bug
3. **Vultr cobra base + usage** (no es tarifa plana), pero el extra es <$1/mes para tráfico bajo
4. **deploy.sh con `git pull --rebase` antes de push** = solución arquitectónica al problema de divergencia
5. **El user prefiere planes concisos** con bullets, no prosa larga

### Misterio sin resolver
- Commit `01a2d10` "auto-update: 2026-06-24 23:30" sigue en el historial pero no sabemos qué lo generó. Probablemente un test manual que se nos olvidó.

### Pendiente del user
- [ ] Restaurar cron de `25 11 * * *` a `0 0 * * *` (si todavía está en modo test)
- [ ] Verificar mañana 00:05 que el cron corrió: `ssh root@45.76.29.64 "tail -15 /opt/abismox/deploy.log"`

---

## 📝 Notas de la sesión 2026-06-29 (cartridge carousel v2.0)

### Logros
- ✅ Rediseño completo del home a "Cartridge Carousel" estilo lanzador retro
- ✅ Reemplazo del hero (snake canvas) por console frame CRT simulado
- ✅ Topbar sticky minimal con logo + ONLINE + RSS
- ✅ Featured panel que muestra la noticia seleccionada (con transiciones fade)
- ✅ Carrusel horizontal scroll-snap con cartridges NES-style
- ✅ IntersectionObserver para sync featured ↔ carrusel
- ✅ Flechas ◄ ► + atajos teclado ArrowLeft/Right
- ✅ Posts individuales rediseñados con mini cartridge al lado del titulo
- ✅ Posts relacionados como mini cartridges (no mas tarjetas planas)
- ✅ 3 commits separados por fase
- ✅ Tests locales: HTML parse OK, JS syntax OK, CSS braces OK, build OK

### Decisiones de la sesion
- Cartucho NES rectangular (bordes biselados, label horizontal con color de categoria)
- Featured panel reemplaza hero (sin snake canvas)
- Home + posts rediseñados (consistencia visual completa)
- 3 commits separados (fases 1-2-3)
- CSS Scroll Snap nativo (sin librerias JS)
- prefers-reduced-motion respetado globalmente
- Todos los datos existentes preservados (29 entries en JSON, 23 posts tras cap)

### Pendiente del user
- [ ] `git push` desde PowerShell de los 3 commits v2.0 (o esperar cron 00:00)
- [ ] Verificar visualmente en https://Abismox.github.io/abismox/ despues de 5-10 min de cache CDN

---

## 📝 Notas de la sesión 2026-07-01 (v2.1.0 polish + fix post-hero)

### Logros
- ✅ 8 mejoras visuales integradas (boot, glitch, stars, MEMORY CHECK, 3D tilt, aurora, sound, counter + tooltips)
- ✅ Post-hero rediseñado: info-bar limpia sin cartucho redundante
- ✅ Sanitizer defensivo `sanitize_post_html()` en `build.py` (strip automático anti-cartucho)
- ✅ 23 posts regenerados con nuevo template
- ✅ Commit `0505050` pusheado a main
- ✅ GitHub Pages redespliega automáticamente (~30s)
- ✅ Sin cambios necesarios en VPS (template se regenera desde git)

### Decisiones de diseño (argumentadas con skill `frontend-design`)
- "The hero is a thesis": en el post, el protagonista es el contenido, no un cartucho decorativo
- "Spend your boldness in one place": la identidad cartucho ya está en el home, no duplicarla en posts
- "Cut any decoration that does not serve the brief": el cartucho en el post era ruido visual redundante
- "Less is more": evitar el efecto "AI-generated generic decoration"

### Pendientes para futuras sesiones
- [ ] Fix bug `kebab-case.html` (prompt slug en `build.py`)
- [ ] Editar default `api.minimax.chat → api.minimax.io` en `build.py`
- [ ] Regenerar `og-image.png` para v2.1.0 (mostrar info-bar en vez de cartucho)
- [ ] Considerar eliminar también los `.rel-cartridge` en "OTRAS DE X" (opcional, usuario debe decidir)
- [ ] Dark/light toggle (descartado hasta nuevo aviso)

---

## 📝 Notas de la sesión 2026-07-02 (security + arquitectura nueva)

### Logros principales
- ✅ **Security review** ejecutado con skill `security-review` → 3 vulnerabilidades encontradas y arregladas (commit `fb1ffa3`):
  1. **Stored XSS via `javascript:` URL en `link_externo`** (HIGH) — `html.escape()` no neutraliza esquemas URL; solucionado con `_validar_link_externo()` que acepta solo `http(s)`
  2. **JSON-LD script-tag breakout** (HIGH) — `json.dumps` no escapa `</script>`; solucionado con `_jsonld_safe()` que reemplaza `</` → `<\/`
  3. **Path traversal + XSS via slug sin sanear** (MEDIUM) — solucionado con `_SLUG_RE` + `_sanitizar_slug()` + `Path.resolve().is_relative_to()` guard en `render_posts`
- ✅ **UX fix: botones RSS removidos** — eliminados del topbar (`index.html:79`), footer (`index.html:165`) y nav de posts (`template_post.html:51`). Mantenido `<link rel="alternate" type="application/rss+xml">` en head para auto-discovery (lectores RSS siguen funcionando)
- ✅ **`deploy.sh` endurecido** — añadido `git rebase --abort 2>/dev/null || true` al inicio (commit `a9556f8`) para hacerlo idempotente ante rebase en curso
- ✅ **NUEVA ARQUITECTURA (la grande)** — separación de fetch (VPS) y render (GitHub Action):
  - **VPS (`deploy.sh`)**: solo hace `git pull --ff-only` + `python build.py --only-fetch` + commitea `data/noticias.json` + push. NO toca HTML
  - **GitHub Action (`.github/workflows/render.yml`)**: triggerea cuando cambia `data/noticias.json`, corre `python build.py --only-render`, commitea `posts/*.html` + `feed.xml` + `sitemap.xml`
  - **Resultado**: cero conflictos Windows-VPS (cada quien escribe archivos distintos)

### Commits de la sesión
```
fb1ffa3 fix: cerrar javascript: XSS, JSON-LD breakout y path traversal via slug
0505050 feat: v2.1.0 polish + fix post-hero sin cartucho (anterior)
a9556f8 fix(deploy): abortar rebase en curso al inicio para ser idempotente
c8baa0d feat(architecture): separar fetch (VPS) y render (GitHub Action)
457f379 auto: fetch noticias 2026-07-02 03:35              ← VPS ejecutó --only-fetch
fdf9a61 auto: render posts 2026-07-02T09:35:29Z           ← GitHub Action ejecutó --only-render
```

### ✅ LA NUEVA ARQUITECTURA FUNCIONÓ A LA PRIMERA
Los commits `457f379` y `fdf9a61` lo prueban:
- `457f379` (VPS, 03:35 Guanajuato) → solo `data/noticias.json` modificado
- `fdf9a61` (GitHub Action, 09:35 UTC) → solo `posts/*.html` + `feed.xml` + `sitemap.xml` modificados
- Sin conflictos, sin intervención manual, end-to-end en ~6 horas

### Archivos modificados/creados
- `build.py` — añadidos `_SLUG_RE`, `_sanitizar_slug()`, `_validar_link_externo()`, `_jsonld_safe()`, guard path-traversal, regex slug, defensa en `validar_noticia`
- `main.js` — `escapeAttr(internalUrl)` en renderFeatured
- `index.html` — añadida meta CSP, removido botón RSS topbar y footer
- `template_post.html` — añadida meta CSP, removido botón RSS del nav, añadida auto-discovery en head
- `posts/*.html` (×27) — regenerados con nuevo template (sin RSS buttons, con CSP)
- `feed.xml`, `sitemap.xml` — regenerados
- `deploy.sh` — simplificado a solo `--only-fetch` + commit de `data/noticias.json`
- `.github/workflows/render.yml` — **NUEVO** workflow de render
- `.gitignore` — añadida línea `_preview/`

### Drama de la sesión (documentar para no repetir)
1. Conflicto de rebase en VPS por cron corriendo mientras Windows pusheaba → resuelto con `git rebase --abort` + `git reset --hard origin/main` en VPS
2. Drama de vim atrapando al usuario con un swap file viejo (`.COMMIT_EDITMSG.swp`) → solución: `A` (abort) + `del .git\.COMMIT_EDITMSG.swp` + usar `git commit -m "..."` directamente sin abrir editor
3. Considerado revertir la arquitectura (`git revert c8baa0d`) → no aplicado; el log reveló que ya estaba funcionando
4. Lección: **antes de revertir, revisar el log** — la "decisión de revertir" era innecesaria porque el sistema ya probó funcionar

### Decisiones de diseño de la sesión
- **VPS = "data fetcher"**: solo escribe JSON. GitHub Action = "renderer" (HTML, feed, sitemap). Separación clara de responsabilidades
- **CSP en meta tag** (no en header HTTP — GitHub Pages no permite headers custom gratis): `default-src 'self'; script-src 'self' 'unsafe-inline'; ...`
- **RSS auto-discovery preservado**: lectores RSS siguen detectando el feed aunque el botón visible desaparezca (importante para no romper Feedly/NetNewsWire users)
- **defang `</` → `<\/` en JSON-LD**: previene XSS via script-tag breakout sin romper JSON válido (los parsers revierten `\/` a `/`)

### Pendientes
- [ ] Verificar que el próximo cron del VPS (00:00 Guanajuato) sigue funcionando con la arquitectura nueva
- [ ] Verificar en GitHub Actions que el workflow se sigue disparando
- [ ] Considerar agregar notificaciones (Telegram/Discord/email) cuando el workflow o el deploy falla
- [ ] Considerar limitar frecuencia del cron (cada 6h en vez de diario) si se quiere contenido más fresco
- [ ] Limpiar el `01a2d10` misterioso del historial (sigue ahí, sin importancia)

### Cómo retomar mañana
> "Hola, leí CONTEXT.md. ¿Cómo sigue?"
> O simplemente: abrir el proyecto y preguntar qué hacer.

Para verificar que todo está vivo:
```bash
# 1. Commits en GitHub
curl --ssl-no-revoke -s https://api.github.com/repos/Abismox/abismox/commits | jq -r '.[0:3] | .[] | "\(.sha[0:7]) \(.commit.message | split("\n")[0])"'

# 2. Sitio activo
curl --ssl-no-revoke -sI https://Abismox.github.io/abismox/ | head -3

# 3. Último run del GitHub Action
# Ir a https://github.com/Abismox/abismox/actions
```

---

## 📝 Notas de la sesión 2026-07-02 (continuación — slug fix + git workflow)

### Logros
- ✅ **Test end-to-end de la arquitectura nueva** ejecutado manualmente desde VPS (`./deploy.sh` → commit JSON → Action triggerea → render commit → Pages deploy). Probó que las 2 fases (fetch en VPS, render en Action) están aisladas y no se pisan.
- ✅ Detectado un bug nuevo durante el test: la entrada de **Assassin's Creed Black Flag** en el JSON tenía el slug `"kebab-case"` heredado (minimax ecoheó el ejemplo) Y una segunda entrada (la de "EL FIN DE LOS DISCOS DE PLAYSTATION...") tenía slug ausente — esta última era **dropeada silenciosamente** por `validar_noticia` y nunca llegaba a renderizarse.
- ✅ **4 fixes en commit `9d0bf5c`** (rebased, SHA original era `ca9bbc3`):
  1. **Prompt ejemplo** cambiado de `"kebab-case"` → `"titulo-de-la-noticia"` (consistente con el título genérico del ejemplo)
  2. **`_SLUG_PLACEHOLDERS` blacklist** añadida (10 placeholders conocidos)
  3. **`validar_noticia` re-escrito**: si slug falta o está en la blacklist, **deriva del título** en vez de dropear la noticia
  4. **`MINIMAX_BASE_URL` default** cambiado a `api.minimax.io` en `build.py` (Option B pendiente). `.env.example` actualizado.
- ✅ **Tests unitarios locales** con 7 casos pasando: kebab-case derivación, slug ausente derivación, slug vacío derivación, slug legítimo intacto, nuevo placeholder "titulo-de-la-noticia" rechazado, javascript: URL bloqueado (XSS defense intacto), sin título derivable dropeado.
- ✅ **Setup de git workflow local** (`gpush` alias + `pull.rebase=true`) — fin del ciclo "fetch first" para siempre
- ✅ **Discovery**: GitHub Pages puede fallar transitoriamente con "Deployment failed, try again later." durante `syncing_files` — es infra de Pages, no del código. Workaround: re-run desde UI. Observado en `pages-build-deployment #32`.

### Commits de la sesión
- `ca9bbc3` → `9d0bf5c` (rebased) — fix(build): blacklist slug placeholders + title-derivation + URL default

### Decisiones
- **Mantener `gpush` global** (no local-only) — funciona en cualquier repo del usuario
- **No consolidar las Notas del 2026-07-02** en una sola — el usuario prefiere historial granular para sesiones largas
- **Cleanup de `kebab-case.html`** se hará automáticamente vía el loop de huérfanos en `render_posts` cuando el slug en JSON se normalice en el próximo `--only-fetch` del VPS (cron 00:00 Guanajuato)
- **Post-procesar títulos** para corregir typos como "ASASSIN'S" → queda como pendiente no crítico (la IA de minimax a veces escribe mal)

### Pendientes para futuras sesiones
- [ ] Verificar que `kebab-case.html` se eliminó del repo tras próximo render (puede hacerse con `git fetch` y luego `ls posts/` o vía web en el repo)
- [ ] Verificar que el sitio ahora tiene URLs limpias para todas las entradas (en particular Assassin's Creed → debería ser `el-remake-de-assassins-creed-black-flag-estara-verificado-en-steam-deck.html` o similar derivado del título)
- [ ] Considerar `core.hooksPath` con `pre-push` hook global como capa extra (opcional)
- [ ] Considerar notificaciones (Telegram/Discord/email) cuando Pages deploy falla
- [ ] Limpiar el `01a2d10` misterioso del historial (sigue ahí, sin importancia)

### Drama de la sesión (documentar para no repetir)
1. **Conflicto "fetch first"** clásico al intentar push de `ca9bbc3` — resuelto con `git pull --rebase origin main` antes del push. El rebase cambió el SHA de `ca9bbc3` → `9d0bf5c`.
2. **Mi propio bug en el fix**: en `validar_noticia`, la primera versión pasaba `slug_crudo = ""` (cuando era placeholder), pero `_sanitizar_slug("")` devolvía `"post"` (porque `slugify("")` tiene fallback `"post"`). Resultado: kebab-case se convertía en `post`, no en el slug del título. Detectado y arreglado con un test unitario antes de hacer push — el test 1 mostró `out["slug"] = "post"` en vez de derivado del título.
3. **Pages deploy transient failure**: workflow `pages-build-deployment #32` falló en `syncing_files` después de 25 polls en `deployment_queued`. Re-run desde UI pasó en 17s — no es bug del sitio, es de Pages infra.

---

**Última actualización:** 2026-07-02 14:30 UTC (final de sesión fix slug + git workflow + test arquitectura)
**Estado del sitio:** ✅ Arquitectura nueva funcionando, kebab-case.html pendiente de limpieza automática
**Último commit:** `9d0bf5c fix(build): blacklist slug placeholders + title-derivation + correct default API URL`
**Estado del cron VPS:** ✅ Activo, hace solo `--only-fetch` (commit JSON)
**Estado del GitHub Action:** ✅ Activo, triggerea cuando JSON cambia, hace `--only-render` (commit HTML)
**Estado del cap:** ✅ 28 posts en `/posts/` (incluye kebab-case.html — pendiente remover)
**Estado de git workflow (local):** ✅ `gpush` alias + `pull.rebase=true` configurados globalmente
**Próxima sesión:** verificar limpieza de `kebab-case.html` tras próximo render, considerar notificaciones o ajustes finos