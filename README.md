# ABISMOX // Gaming + Tech News Archive

Archivo automático de noticias gaming + tecnología con estética retro N64/PS1.

## Arquitectura

```
[VPS Vultr · cron diario]                    [GitHub Pages · gratis]
        ↓                                            ↑
   python3 build.py  ──── git push ────────→  Pages redespliega
        ↓                                            ↓
   news → posts HTML → feed.xml → sitemap  [https://user.github.io/abismox/]
```

- **Frontend:** 100% estático en GitHub Pages (HTML + CSS + JS vanilla)
- **Generación:** Script Python en VPS que scrapea RSS + resume con minimax
- **Deploy:** Cron diario pushea cambios al repo, Pages redespliega solo

## Estructura

```
Blogx/
├── build.py              ← Script generador (scrapea + IA + renderiza)
├── deploy.sh             ← Wrapper: build.py + git push
├── template_post.html    ← Plantilla para posts individuales
├── generate_assets.py    ← Genera favicon.ico + og-image.png (Pillow)
├── index.html            ← Landing con feed + búsqueda + filtros
├── style.css             ← Estilos retro (N64/PS1)
├── main.js               ├── Carga JSON, búsqueda, share, Web Share API
├── snake.js              ← Snake decorativo del hero
├── data/
│   └── noticias.json     ← Base de datos (generada por build.py)
├── posts/                ← HTML por noticia (generado, se commitea)
├── feed.xml              ← RSS 2.0 (generado)
├── sitemap.xml           ← XML sitemap (generado)
├── robots.txt            ← (generado)
├── favicon.ico           ← 16/32/48 multi-res pixel art
├── og-image.png          ← 1200×630 para Open Graph
├── .nojekyll             ← Desactiva Jekyll en Pages
└── .env.example          ← Template de secrets (NO commitear .env)
```

## Setup inicial

### 1. Crear repo en GitHub

```bash
# Repo público para GitHub Pages gratis
# Nombre: abismox
# URL: https://github.com/Abismox/abismox
```

### 2. Clonar en VPS (Ubuntu)

```bash
ssh root@TU-VPS
apt update && apt install -y python3 python3-pip git
cd /opt && git clone https://github.com/Abismox/abismox.git
cd abismox
pip3 install requests python-dotenv Pillow
```

### 3. Configurar secrets

```bash
cp .env.example .env
nano .env   # pegar MINIMAX_API_KEY y GH_TOKEN
chmod 600 .env
```

**Obtener tokens:**
- **MINIMAX_API_KEY:** https://api.minimax.chat
- **GH_TOKEN:** https://github.com/settings/tokens → Generate new token (classic) → scope `repo`

### 4. Activar GitHub Pages

En GitHub: **Settings → Pages → Source: `main` / `(root)` → Save**

URL final: `https://Abismox.github.io/abismox/`

### 5. Activar cron diario

```bash
crontab -e
# Añadir:
0 8 * * * /opt/abismox/deploy.sh >> /opt/abismox/deploy.log 2>&1
```

## Uso

### Build manual local

```bash
# Build completo (scrapea + IA + renderiza)
python3 build.py

# Solo renderizar desde data/noticias.json (sin gastar API)
python3 build.py --only-render

# Solo scrapear + IA (actualiza JSON, no genera HTML)
python3 build.py --only-fetch

# Simular sin escribir nada
python3 build.py --dry-run

# Custom URL base (testing local)
python3 build.py --site-url http://localhost:8000/abismox/
```

### Deploy manual

```bash
chmod +x deploy.sh
./deploy.sh
```

### Regenerar assets (favicon, og-image)

```bash
python3 generate_assets.py
```

## Características del sitio

- **Hero retro** con Snake canvas animado + scanlines + vignette
- **Búsqueda en vivo** con debounce (atajo `/` enfoca, `Esc` limpia)
- **Filtros** por categoría (TODO / VIDEOJUEGOS / TECNOLOGÍA)
- **Posts individuales** con OG tags, JSON-LD, breadcrumb, relacionados, compartir (Web Share API)
- **RSS** en `feed.xml`
- **Sitemap** en `sitemap.xml`
- **Open Graph / Twitter Cards** con og-image fija
- **Skip-link accesible** para teclado
- **Reading time** calculado por card
- **Responsive** mobile-first (1/2/3 columnas)
- **`prefers-reduced-motion`** respetado

## Personalizar URL del sitio

Después del primer deploy, reemplaza `Abismox` en:

- `index.html` (canonical, og:url, JSON-LD)
- `build.py` (`SITE_BASE_URL` por defecto, o usa `--site-url`)

Si usas custom domain (`abismox.com`):

```bash
echo "abismox.com" > CNAME
git add CNAME && git commit -m "add custom domain" && git push
```

Y configura DNS CNAME: `abismox.com → Abismox.github.io`

## Stack

- HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- Python 3.10+ con `requests`, `python-dotenv`, `Pillow`
- GitHub Pages (hosting estático)
- Vultr VPS (build automation)
- minimax API (resumen de noticias)

## Licencia

© 2026 ABISMOX · Powered by Autonomous Agent