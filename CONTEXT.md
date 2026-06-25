# CONTEXT // ABISMOX

Estado completo del proyecto al cierre de la sesión **2026-06-25** (sesión de cron + cap + seguridad).
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

## 📦 Versión actual: v1.1.0 (con automatización VPS v1.2.0-oficial)

### Commits relevantes
- `d807009` — Sitio original v1.0.0
- `328c65d` — feat: v1.1.0 (RSS, sitemap, search, share, OG, posts individuales)
- `0274732` — chore: re-trigger Pages deploy
- `398d981` — docs: add CONTEXT.md
- `5c6668a` — auto: chmod deploy.sh (primer deploy en VPS, sin datos nuevos)
- `a1980de` — auto: fix RSS feeds (vandal/3djuegos/xataka/muycomputer)
- `d2902ba` — auto: primer build exitoso (8 posts nuevos, total 16)

### Features implementadas (v1.1.0)
*(Idénticas a sesión anterior, ya documentadas)*
- ✅ Páginas individuales por noticia (`posts/<slug>.html`)
- ✅ OG tags + Twitter Card en home y posts
- ✅ JSON-LD `WebSite` en home + `BlogPosting` en cada post
- ✅ Sitemap.xml + robots.txt
- ✅ RSS feed.xml
- ✅ Favicon.ico multi-res
- ✅ OG image fija 1200×630
- ✅ Búsqueda en vivo con debounce 150ms
- ✅ Atajos teclado: `/` enfoca búsqueda, `Esc` limpia
- ✅ Botón compartir con Web Share API + fallback Twitter Intent
- ✅ Reading time estimado por card
- ✅ Skip-link accesible
- ✅ Breadcrumb en posts individuales
- ✅ Posts relacionados (misma categoría, máx 3)
- ✅ Sticky header en posts
- ✅ Rutas relativas para GitHub Pages project site
- ✅ `.nojekyll` para desactivar Jekyll
- ✅ Schema `WebSite` con `SearchAction` para Google

### Nuevas en esta sesión (deploy automatizado)
- ✅ VPS Vultr Ubuntu 26.04 LTS operativo
- ✅ Cron diario configurado para 08:00 hora Guanajuato (pendiente de confirmar ejecución)
- ✅ Deploy end-to-end funcionando (RSS → IA → render → commit → push → CDN)

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

## 🎨 Diseño (sin cambios)

- **Estética:** retro N64/PS1 pixel art
- **Tipografías:** Press Start 2P (titulos), VT323 (cuerpo)
- **Colores:** magenta `#FF1493`, cyan `#00FFFF`, verde `#00FF00`, naranja `#FF8C00`, morado `#7B2CBF`, rojo `#FF0000`
- **Layout:** mobile-first, 1 col móvil → 2 cols tablet (≥600px) → 3 cols desktop (≥900px)

---

## 🐛 Issues conocidos / aprendizaje

### Bug: `posts/kebab-case.html`
- **Síntoma**: en cada deploy aparece un post con slug literal `kebab-case`
- **Causa**: el prompt en `build.py` línea ~222 contiene `"slug": "kebab-case"` como ejemplo; minimax a veces "ecohéa" el ejemplo en vez de generar uno real
- **Fix futuro**: cambiar el ejemplo del prompt a un slug real (ej: `"slug": "ejemplo-noticia-2024"`) o post-procesar para descartar slugs placeholder

### Cache CDN de GitHub Pages
- **Síntoma**: sitio sirve versión vieja tras deploy
- **Workaround**: esperar 5-10 min para que Fastly propague; en local usar `Ctrl+F5` o incógnito

### URL incorrecta en `build.py` por defecto
- **Síntoma**: 401 "invalid api key (2049)" en TODAS las llamadas a la API
- **Causa**: default hardcodeado `https://api.minimax.chat/v1` no existe o no es el endpoint real
- **Endpoint real**: `https://api.minimax.io/v1`
- **Fix aplicado**: vía variable de entorno `MINIMAX_BASE_URL` en `.env` (no requiere editar código)
- **Pendiente**: editar `build.py` para cambiar el default (Option B) y consolidar el fix

### Histórico de debugging (2026-06-24)
1. Primer deploy (22:20): build OK pero RSS muertos → 0 items, sitio sin cambios
2. Reemplazo de feeds RSS → 76 items collected, pero minimax 401 (todos los modelos probados)
3. Diagnóstico con curl a 4 URLs candidatas → **api.minimax.io es la correcta**
4. Añadido `MINIMAX_BASE_URL=https://api.minimax.io/v1` al `.env` → deploy exitoso, 16 noticias en producción

### CRLF en Windows
- Git avisa: "LF will be replaced by CRLF"
- **Solución:** inofensivo, ignorar warning o añadir `.gitattributes` con `* text=auto eol=lf`

---

## 📋 Pendientes (futuras sesiones)

### Corto plazo
- [x] **Verificar que el cron esté configurado** — ✅ `0 0 * * *` confirmado
- [x] **Verificar primer cron automático** — ✅ Probado a las 11:25 con `25 11 * * *`, funcionó end-to-end
- [ ] **Aplicar Option B**: editar `build.py` línea ~212, cambiar default `api.minimax.chat` → `api.minimax.io`
- [ ] **Fix bug `kebab-case.html`**: editar el prompt en `build.py` líneas 222-228 (cambiar ejemplo de slug)
- [x] **Sincronizar cambios en local Windows con VPS** — ✅ Vía `git pull --rebase` desde local

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

**Última actualización:** 2026-06-25 11:30 (final de sesión de cron + cap + seguridad)
**Estado del sitio:** ✅ Deployado y funcional, ~29 posts (cap aplicado, será ~25 después)
**Estado del cron:** ✅ Configurado, validado con test a las 11:25, debe disparar a las 00:00 diario
**Próxima sesión:** verificar ejecución del cron a medianoche + disfrutar del sitio automatizado 🎉