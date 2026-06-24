# CONTEXT // ABISMOX

Estado completo del proyecto al final de la sesión del **2026-06-24**.
Referencia rápida para retomar trabajo en cualquier momento.

---

## 👤 Usuario

- **GitHub username:** `Abismox`
- **Email git:** `erickabismo@gmail.com`
- **PC local:** Windows (PowerShell), repo en `C:\OpenCode_P\Blogx`
- **Hosting frontend:** GitHub Pages (gratis)
- **Hosting backend:** VPS Vultr (próximamente, para script Python)

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

---

## 🏗️ Arquitectura

```
[VPS Vultr · cron diario 08:00]
        ↓
   python3 build.py
   (llama minimax API → genera contenido)
        ↓
   git add + commit + push (PAT en .env)
        ↓
   [GitHub: Abismox/abismox]
        ↓
   [GitHub Pages · deploy ~30-60s]
        ↓
   [Visitantes → Abismox.github.io/abismox/]
```

**Hoy (24/06/2026) ya está desplegado y funcional**, sin VPS todavía.

---

## 📦 Versión actual: v1.1.0

Commit actual en `main`: `0274732` (re-trigger para deploy)
Commit anterior: `328c65d` (feat: v1.1.0)
Commit inicial: `d807009` (sitio original v1.0.0)

### Features implementadas en v1.1.0
- ✅ Páginas individuales por noticia (`posts/<slug>.html`)
- ✅ OG tags + Twitter Card en home y posts
- ✅ JSON-LD `WebSite` en home + `BlogPosting` en cada post
- ✅ Sitemap.xml (9 URLs) + robots.txt
- ✅ RSS feed.xml (8 items)
- ✅ Favicon.ico multi-res (16/32/48 px, pixel art A magenta+cyan)
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

---

## 📁 Estructura del repo

```
Blogx/
├── build.py              ← generador estático (scrapea + IA + render)
├── deploy.sh             ← wrapper bash: build + git push
├── template_post.html    ← plantilla para posts individuales
├── generate_assets.py    ← regenera favicon.ico + og-image.png
├── index.html            ← landing (con todos los meta tags)
├── style.css             ← estilos retro (N64/PS1)
├── main.js               ← carga JSON, búsqueda, share, Web Share
├── snake.js              ← canvas animado del hero
├── favicon.ico           ← multi-res pixel art
├── og-image.png          ← 1200×630 Open Graph
├── data/
│   └── noticias.json     ← 8 entries, todas con campo `slug`
├── posts/                ← 8 HTML individuales (commiteados)
│   ├── nvidia-anuncia-rtx-6090-32gb-vram-ray-tracing-2-0.html
│   ├── openai-lanza-gpt-6-razonamiento-multimodal-nativo-2m-tokens.html
│   ├── gta-vi-lanzamiento-confirmado-octubre-2026-ps5-xbox-series.html
│   ├── apple-m5-ultra-32-nucleos-cpu-80-gpu-proceso-2nm.html
│   ├── elden-ring-nightreign-from-software-reinventa-cooperativo.html
│   ├── vs-code-2-0-reescritura-completa-rust-modo-agent-nativo.html
│   ├── sony-anuncia-ps5-pro-slim-unidad-disco-extraible-mayo.html
│   └── anthropic-presenta-claude-opus-4-5-ventana-1m-tokens.html
├── feed.xml              ← RSS 2.0
├── sitemap.xml           ← XML sitemap
├── robots.txt
├── .nojekyll
├── .env.example          ← template (NO commitear .env)
├── .gitignore
└── README.md
```

---

## 🔧 Detalles técnicos clave

### `build.py` (VPS)
- Función `slugify(texto)` → kebab-case
- Función `calcular_reading_time(texto)` → palabras / 200
- Función `render_post_html(noticia, plantilla, todas)` → escribe `posts/<slug>.html`
- Función `render_feed_xml(noticias)` → RSS 2.0 últimas 20
- Función `render_sitemap(noticias)` → index + posts
- Función `fetch_rss_items()` → lee feeds RSS hardcodeados
- Función `generar_con_minimax(item)` → API minimax, devuelve JSON
- `SITE_BASE_URL` default: `https://Abismox.github.io/abismox/`
- Argumentos: `--dry-run`, `--only-render`, `--only-fetch`, `--site-url`
- Dependencias: `requests`, `python-dotenv`, `Pillow`

### `template_post.html` placeholders
`{{TITULO}}`, `{{PREVIEW_HTML}}`, `{{SLUG}}`, `{{CATEGORIA}}`, `{{CATEGORIA_TITULO}}`,
`{{COLOR}}`, `{{FECHA_ISO}}`, `{{FECHA}}`, `{{CONTENIDO_HTML}}`, `{{READING_TIME}}`,
`{{FUENTE_LABEL}}`, `{{FUENTE_CLASS}}`, `{{TITULO_CORTO}}`, `{{CANONICAL_URL}}`,
`{{OG_IMAGE_URL}}`, `{{BASE_HREF}}`, `{{CTA_EXTERNO_HTML}}`, `{{RELACIONADOS_HTML}}`,
`{{JSONLD}}`, `{{TITULO_ATTR}}`, `{{TITULO_URLENC}}`, `{{URL_ENCODED}}`

### Fuentes RSS en `build.py` (hardcoded)
```python
FUENTES_RSS = [
    ("https://www.eurogamer.es/?feed=rss", "videojuegos"),
    ("https://feeds.feedburner.com/IGN/IGNArticles", "videojuegos"),
    ("https://www.hackplayers.com/feed", "tecnologia"),
    ("https://www.genbeta.com/feed", "tecnologia"),
]
```

### Prompts IA (en `build.py`)
- System: `"Respondes solo JSON válido."`
- User template: prompt para resumir en estilo retro-pixel mayúsculas, devuelve JSON con keys: `slug`, `titulo`, `preview`, `contenido`, `color` (hex)
- Model: `MiniMax-Text-01`, temperature 0.4, max_tokens 600

---

## 🎨 Diseño

- **Estética:** retro N64/PS1 pixel art
- **Tipografías:** Press Start 2P (titulos), VT323 (cuerpo)
- **Colores:** magenta `#FF1493`, cyan `#00FFFF`, verde `#00FF00`, naranja `#FF8C00`, morado `#7B2CBF`, rojo `#FF0000`
- **Layout:** mobile-first, 1 col móvil → 2 cols tablet (≥600px) → 3 cols desktop (≥900px)

---

## 📋 Pendientes (futuras sesiones)

### Corto plazo
- [ ] Montar VPS Vultr
- [ ] Crear PAT en GitHub (scope `repo`)
- [ ] Obtener MINIMAX_API_KEY
- [ ] Configurar cron `0 8 * * * /opt/abismox/deploy.sh`
- [ ] Probar build.py con API real

### Features opcionales (no comprometidas)
- [ ] Dark/light toggle
- [ ] Tags múltiples por noticia
- [ ] Paginación
- [ ] Google Analytics / Plausible
- [ ] Custom domain (CNAME)
- [ ] Sistema de comentarios (giscus)
- [ ] Newsletter (Buttondown)
- [ ] Internacionalización (i18n EN/ES)

---

## 🐛 Issues conocidos / aprendizaje

### GitHub Pages deploy stuck
- **Síntoma:** workflow "In progress" indefinidamente, sitio no actualiza
- **Workaround:** empty commit triggea nuevo run; GitHub cancela el viejo
- **Status actual:** resuelto tras ~10 min en sesión 2026-06-24

### Cache CDN
- **Síntoma:** sitio sirve versión vieja después de deploy
- **Workaround:** probar en incógnito, VPN, o esperar 5-10 min

### CRLF en Windows
- Git avisa: "LF will be replaced by CRLF"
- **Solución:** inofensivo, ignorar warning o añadir `.gitattributes` con `* text=auto eol=lf`

---

## 💬 Cómo retomar mañana

**Opción A — Rápida (recomendada):**
> "Hola, sigamos con ABISMOX. Lee CONTEXT.md"

**Opción B — Con verificación:**
> "Hola, ¿sigue deployado Abismox.github.io/abismox/? Quiero [X cosa]"

**Opción C — Emergía:**
> Solo abre el proyecto y dime qué quieres hacer. El estado del repo está intacto.

---

## 📝 Notas de la sesión

- Análisis inicial: web era v1.0.0 básica, faltaba identidad personal, OG tags, RSS, búsqueda, posts individuales
- Decidido: mantener anónimo/automático (no "About" personal)
- Stack: 100% vanilla JS + Python build, GitHub Pages + Vultr VPS
- Stack IA: minimax para resumir/estructurar
- Frecuencia: 1 build diario (cron 08:00)
- Decisión estética: sin imágenes por ahora, OG image fija
- El usuario prefiere respuestas concisas en español
- El usuario ejecuta pasos manuales en PowerShell (no bash)

---

**Última actualización:** 2026-06-24 17:20 (final de sesión)
**Estado del sitio:** ✅ Deployado y funcional
**Próxima sesión:** pendiente (mañana u otro día)