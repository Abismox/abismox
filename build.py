#!/usr/bin/env python3
"""
ABISMOX // build.py
Generador estático: scraping + minimax (resumen) + render de posts + feed + sitemap.

Uso:
    python build.py                 # build completo
    python build.py --dry-run       # no escribe archivos, solo log
    python build.py --only-render   # solo renderiza HTML/feed/sitemap desde data/noticias.json
    python build.py --only-fetch    # solo scrapea + minimax, actualiza data/noticias.json

Variables de entorno (.env):
    MINIMAX_API_KEY     (requerido para fetch)
    MINIMAX_BASE_URL    (default: https://api.minimax.chat/v1)
    SITE_BASE_URL       (default: https://Abismox.github.io/abismox/)
    GITHUB_REPO         (informativo)
"""

from __future__ import annotations

import argparse
import html
import json
import logging
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from xml.sax.saxutils import escape as xml_escape

try:
    import requests  # type: ignore
except ImportError:
    requests = None  # type: ignore

try:
    from dotenv import load_dotenv  # type: ignore
except ImportError:
    load_dotenv = None  # type: ignore


# ============================================================
# CONFIG
# ============================================================
ROOT = Path(__file__).parent.resolve()
TEMPLATE_PATH = ROOT / "template_post.html"
DATA_PATH = ROOT / "data" / "noticias.json"
POSTS_DIR = ROOT / "posts"
FEED_PATH = ROOT / "feed.xml"
SITEMAP_PATH = ROOT / "sitemap.xml"
ROBOTS_PATH = ROOT / "robots.txt"

SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://Abismox.github.io/abismox/").rstrip("/") + "/"
PROJECT_NAME = "abismox"

CONTENT_PREVIEW_LENGTH = 300
FEED_MAX_ITEMS = 20
RELATED_MAX_ITEMS = 3
WORDS_PER_MINUTE = 200
MAX_POSTS = 30
MAX_DAYS = 30

FUENTES_RSS = [
    ("https://vandal.elespanol.com/rss", "videojuegos"),
    ("https://www.3djuegos.com/rss/juegos/", "videojuegos"),
    ("https://www.xataka.com/feedburner.xml", "tecnologia"),
    ("https://www.muycomputer.com/feed/", "tecnologia"),
]

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("abismox")


# ============================================================
# UTILS
# ============================================================
def slugify(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = texto.lower()
    texto = re.sub(r"[^a-z0-9]+", "-", texto)
    texto = texto.strip("-")
    return texto or "post"


def leer_json(path: Path) -> Dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def escribir_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def calcular_reading_time(texto: str) -> int:
    if not texto:
        return 1
    palabras = len(re.findall(r"\S+", texto))
    minutos = max(1, round(palabras / WORDS_PER_MINUTE))
    return minutos


def format_date_es(fecha_iso: str) -> str:
    try:
        dt = datetime.fromisoformat(fecha_iso)
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return fecha_iso


def categoria_titulo(cat: str) -> str:
    mapa = {
        "videojuegos": "VIDEOJUEGOS",
        "tecnologia": "TECNOLOGÍA",
    }
    return mapa.get((cat or "").lower(), (cat or "GENERAL").upper())


def validar_noticia(n: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not n.get("slug"):
        log.warning("Noticia sin slug, id=%s: saltando", n.get("id"))
        return None
    if not n.get("titulo") or not n.get("fecha"):
        log.warning("Noticia incompleta, slug=%s: saltando", n.get("slug"))
        return None
    if not n.get("color"):
        n["color"] = "#FF1493"
    if not n.get("categoria"):
        n["categoria"] = "general"
    return n


def dedupe_y_orden(noticias: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Elimina duplicados por slug y ordena por fecha desc."""
    visto = set()
    out = []
    for n in noticias:
        slug = n.get("slug")
        if not slug or slug in visto:
            continue
        visto.add(slug)
        out.append(n)
    out.sort(key=lambda x: x.get("fecha") or "", reverse=True)
    return out


def aplicar_cap(noticias: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Cap por antigüedad (MAX_DAYS) y por cantidad (MAX_POSTS)."""
    if not noticias:
        return []
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_DAYS)
    filtradas = []
    for n in noticias:
        fecha_iso = n.get("fecha", "")
        if not fecha_iso:
            continue
        try:
            fecha_dt = datetime.fromisoformat(fecha_iso).replace(tzinfo=timezone.utc)
            if fecha_dt >= cutoff:
                filtradas.append(n)
        except Exception:
            continue
    if len(filtradas) > MAX_POSTS:
        eliminadas = len(filtradas) - MAX_POSTS
        log.info("Cap por count: %d posts eliminados (max=%d)", eliminadas, MAX_POSTS)
        filtradas = filtradas[:MAX_POSTS]
    log.info("Cap aplicado: %d posts (<=%d dias, <=%d posts)", len(filtradas), MAX_DAYS, MAX_POSTS)
    return filtradas


# ============================================================
# FETCH (scraping RSS + minimax)
# ============================================================
def fetch_rss_items() -> List[Dict[str, str]]:
    """Descarga titulares de feeds RSS y devuelve items crudos."""
    if requests is None:
        log.error("Falta 'requests'. pip install requests")
        return []
    items = []
    headers = {"User-Agent": "ABISMOX/1.1 (+https://abismox)"}
    for url, categoria in FUENTES_RSS:
        try:
            r = requests.get(url, headers=headers, timeout=10)
            r.raise_for_status()
            content = r.content
            for match in re.finditer(
                rb"<item[^>]*>(.*?)</item>", content, re.DOTALL | re.IGNORECASE
            ):
                block = match.group(1)
                title_m = re.search(rb"<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", block, re.DOTALL)
                link_m = re.search(rb"<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>", block, re.DOTALL)
                desc_m = re.search(rb"<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>", block, re.DOTALL)
                pub_m = re.search(rb"<pubDate[^>]*>(.*?)</pubDate>", block, re.DOTALL)
                if not title_m:
                    continue
                title = re.sub(rb"\s+", b" ", title_m.group(1)).decode("utf-8", "ignore").strip()
                link = link_m.group(1).decode("utf-8", "ignore").strip() if link_m else ""
                desc = desc_m.group(1).decode("utf-8", "ignore").strip() if desc_m else ""
                pub = pub_m.group(1).decode("utf-8", "ignore").strip() if pub_m else ""
                items.append({
                    "titulo_crudo": title,
                    "link": link,
                    "desc_crudo": desc,
                    "pub_date": pub,
                    "categoria": categoria,
                })
        except Exception as e:
            log.warning("RSS falló %s: %s", url, e)
    log.info("RSS items collected: %d", len(items))
    return items


def parse_pub_date(pub: str) -> str:
    """Convierte RFC822 a ISO date (YYYY-MM-DD)."""
    if not pub:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(pub)
        if dt and dt.tzinfo:
            dt = dt.astimezone(timezone.utc)
        return (dt or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def generar_con_minimax(item: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """Llama a minimax para resumir/estructurar una noticia."""
    api_key = os.environ.get("MINIMAX_API_KEY")
    base_url = os.environ.get("MINIMAX_BASE_URL", "https://api.minimax.chat/v1")
    if not api_key:
        log.warning("MINIMAX_API_KEY no definida: omitiendo generación con IA")
        return None
    if requests is None:
        log.error("Falta 'requests'. pip install requests")
        return None

    prompt = (
        "Resume la siguiente noticia en estilo retro-pixel (mayúsculas, sin emojis, tono informativo). "
        "Devuelve JSON con esta estructura exacta y NADA MÁS:\n"
        '{"slug": "kebab-case", "titulo": "TITULO EN MAYUSCULAS", '
        '"preview": "1-2 frases", "contenido": "1 parrafo de 3-5 frases", '
        '"color": "#HEX_COLOR"}\n\n'
        f"Titular: {item['titulo_crudo']}\n"
        f"Descripcion: {item.get('desc_crudo', '')[:500]}\n"
        f"Categoria: {item.get('categoria', '')}"
    )
    try:
        r = requests.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "MiniMax-Text-01",
                "messages": [
                    {"role": "system", "content": "Respondes solo JSON válido."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.4,
                "max_tokens": 600,
            },
            timeout=30,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"].strip()
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            log.warning("minimax no devolvió JSON para: %s", item["titulo_crudo"][:60])
            return None
        data = json.loads(match.group(0))
        data["link_externo"] = item.get("link") or None
        data["categoria"] = item.get("categoria", "general")
        data["fecha"] = parse_pub_date(item.get("pub_date", ""))
        data["es_auto"] = True
        data["fuente"] = "auto"
        data.setdefault("slug", slugify(data.get("titulo", "post")))
        return data
    except Exception as e:
        log.warning("minimax falló para '%s': %s", item["titulo_crudo"][:60], e)
        return None


def fetch_noticias(dry_run: bool) -> List[Dict[str, Any]]:
    """Scrapea, resume con IA y combina con histórico."""
    if not dry_run:
        raw = fetch_rss_items()
        nuevas = []
        for item in raw[:8]:
            data = generar_con_minimax(item)
            if data:
                nuevas.append(data)
    else:
        nuevas = []

    historico = []
    if DATA_PATH.exists():
        try:
            historico = leer_json(DATA_PATH).get("noticias", [])
        except Exception as e:
            log.warning("No se pudo leer historico: %s", e)
    combinado = dedupe_y_orden(nuevas + historico)
    combinado = aplicar_cap(combinado)
    combinado = [validar_noticia(n) for n in combinado]
    combinado = [n for n in combinado if n]
    log.info("Noticias combinadas tras dedupe: %d", len(combinado))
    return combinado


# ============================================================
# RENDER: posts individuales
# ============================================================
def contenido_a_parrafos(texto: str) -> str:
    """Divide el contenido en <p> sin escapar entidades."""
    if not texto:
        return ""
    partes = [p.strip() for p in re.split(r"\n\s*\n", texto) if p.strip()]
    if not partes:
        partes = [texto.strip()]
    return "\n".join(f"<p>{html.escape(p)}</p>" for p in partes)


def url_post(slug: str) -> str:
    return f"posts/{slug}.html"


def render_post_html(noticia: Dict[str, Any], plantilla: str, todas: List[Dict[str, Any]]) -> str:
    slug = noticia["slug"]
    titulo = html.escape(noticia["titulo"])
    preview = html.escape(noticia.get("preview", ""))
    contenido_html = contenido_a_parrafos(noticia.get("contenido", ""))
    categoria = noticia.get("categoria", "general")
    categoria_t = categoria_titulo(categoria)
    color = noticia.get("color", "#FF1493")
    fecha_iso = noticia.get("fecha", "")
    fecha_es = format_date_es(fecha_iso)
    reading_time = calcular_reading_time(noticia.get("contenido", "") + " " + noticia.get("preview", ""))
    fuente_label = "FUENTE: AGENTE" if noticia.get("es_auto") else "FUENTE: MANUAL"
    fuente_class = "auto" if noticia.get("es_auto") else "manual"
    titulo_corto = noticia["titulo"]
    if len(titulo_corto) > 50:
        titulo_corto = titulo_corto[:47] + "..."
    titulo_corto = html.escape(titulo_corto)

    canonical = SITE_BASE_URL + url_post(slug)
    og_image = SITE_BASE_URL + "og-image.png"
    base_href = SITE_BASE_URL

    if noticia.get("link_externo"):
        cta = (
            f'<div class="post-cta-externo">\n'
            f'  <a class="card-cta" href="{html.escape(noticia["link_externo"])}" '
            f'target="_blank" rel="noopener noreferrer">'
            f'LEER FUENTE ORIGINAL</a>\n'
            f'</div>'
        )
    else:
        cta = ""

    relacionados_html = render_relacionados(noticia, todas)
    jsonld = construir_jsonld(noticia, canonical, og_image)
    titulo_attr = noticia["titulo"]
    titulo_urlenc = html.escape(noticia["titulo"])

    reemplazos = {
        "{{TITULO}}": titulo,
        "{{PREVIEW_HTML}}": preview,
        "{{SLUG}}": slug,
        "{{CATEGORIA}}": html.escape(categoria),
        "{{CATEGORIA_TITULO}}": categoria_t,
        "{{COLOR}}": color,
        "{{FECHA_ISO}}": fecha_iso,
        "{{FECHA}}": fecha_es,
        "{{CONTENIDO_HTML}}": contenido_html,
        "{{READING_TIME}}": str(reading_time),
        "{{FUENTE_LABEL}}": fuente_label,
        "{{FUENTE_LABEL_SHORT}}": "AUTO" if noticia.get("es_auto") else "MANUAL",
        "{{FUENTE_CLASS}}": fuente_class,
        "{{TITULO_CORTO}}": titulo_corto,
        "{{CANONICAL_URL}}": canonical,
        "{{OG_IMAGE_URL}}": og_image,
        "{{BASE_HREF}}": base_href,
        "{{CTA_EXTERNO_HTML}}": cta,
        "{{RELACIONADOS_HTML}}": relacionados_html,
        "{{JSONLD}}": jsonld,
        "{{TITULO_ATTR}}": html.escape(titulo_attr, quote=True),
        "{{TITULO_URLENC}}": titulo_urlenc,
        "{{URL_ENCODED}}": canonical,
    }
    out = plantilla
    for k, v in reemplazos.items():
        out = out.replace(k, v)
    return sanitize_post_html(out)


def sanitize_post_html(html_str: str) -> str:
    """
    Defensa sistémica anti-cartucho.
    Elimina cualquier rastro del post-hero viejo (cartucho en el hero)
    por si alguna versión cacheada del template se cuela.
    Garantiza que NINGÚN post tenga el recuadro redundante,
    ni en regeneraciones actuales ni futuras.
    """
    import re

    patrones_a_eliminar = [
        # post-cartridge div (con todo su contenido anidado)
        (r'<div\s+class="post-cartridge"[^>]*>.*?</div>\s*</div>', re.DOTALL),
        # post-cartridge__mini (variante)
        (r'<div\s+class="cartridge\s+post-cartridge__mini"[^>]*>.*?</div>\s*</div>', re.DOTALL),
        # post-cartridge-watermark
        (r'<div\s+class="post-cartridge-watermark"[^>]*>.*?</div>\s*', re.DOTALL),
        # post-hero-flex (layout viejo side-by-side)
        (r'<div\s+class="post-hero-flex"[^>]*>.*?</div>\s*</div>', re.DOTALL),
        # post-hero-text standalone
        (r'<div\s+class="post-hero-text"[^>]*>.*?</div>', re.DOTALL),
    ]

    for patron, flags in patrones_a_eliminar:
        html_str = re.sub(patron, '', html_str, flags=flags)

    return html_str


def render_relacionados(noticia: Dict[str, Any], todas: List[Dict[str, Any]]) -> str:
    cat = noticia.get("categoria")
    rel = [n for n in todas if n.get("categoria") == cat and n.get("slug") != noticia.get("slug")]
    rel = rel[:RELATED_MAX_ITEMS]
    if not rel:
        return ""
    cards = []
    for n in rel:
        color = n.get("color", "#FF1493")
        cat_n = html.escape(n.get("categoria", "general"))
        cat_t = categoria_titulo(n.get("categoria", "general"))
        titulo = html.escape(n["titulo"])
        titulo_corto = titulo
        if len(titulo_corto) > 60:
            titulo_corto = titulo_corto[:57] + "..."
        preview_raw = (n.get("preview", "") or "").replace("\n", " ").strip()
        preview = html.escape(preview_raw[:90])
        fecha_iso = n.get("fecha", "")
        try:
            fecha_dt = datetime.fromisoformat(fecha_iso)
            fecha_es = fecha_dt.strftime("%d/%m/%Y")
        except Exception:
            fecha_es = fecha_iso
        reading_time = calcular_reading_time(n.get("contenido", "") + " " + n.get("preview", ""))
        fuente_short = "AUTO" if n.get("es_auto") else "MANUAL"
        url = SITE_BASE_URL + url_post(n["slug"])
        cards.append(
            f'<a class="rel-card" href="{url}" style="--card-color: {color}; --cart-color: {color};">'
            f'<div class="cartridge rel-cartridge">'
            f'<div class="cartridge__label">'
            f'<span class="cartridge__cat">{cat_t}</span>'
            f'<span class="cartridge__date">{fecha_es}</span>'
            f'</div>'
            f'<div class="cartridge__body">'
            f'<h3 class="cartridge__title">{titulo_corto}</h3>'
            f'<p class="cartridge__preview">{preview}...</p>'
            f'</div>'
            f'<div class="cartridge__footer">'
            f'<span class="cartridge__time">▓ {reading_time} MIN</span>'
            f'<span class="cartridge__source">{fuente_short}</span>'
            f'</div>'
            f'</div>'
            f'</a>'
        )
    return (
        '<section class="relacionados" aria-label="Otras noticias relacionadas">\n'
        '  <h2 class="rel-titulo-seccion">▓ OTRAS DE ' + categoria_titulo(cat) + '</h2>\n'
        '  <div class="rel-grid">\n    '
        + "\n    ".join(cards)
        + '\n  </div>\n</section>'
    )


def construir_jsonld(n: Dict[str, Any], canonical: str, og_image: str) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": n["titulo"],
        "description": n.get("preview", ""),
        "articleBody": n.get("contenido", ""),
        "datePublished": n.get("fecha", ""),
        "dateModified": n.get("fecha", ""),
        "author": {"@type": "Organization", "name": "ABISMOX Agent", "url": SITE_BASE_URL},
        "publisher": {
            "@type": "Organization",
            "name": "ABISMOX",
            "logo": {"@type": "ImageObject", "url": og_image},
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
        "image": og_image,
        "articleSection": categoria_titulo(n.get("categoria", "")),
        "inLanguage": "es",
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def render_posts(noticias: List[Dict[str, Any]]) -> int:
    plantilla = TEMPLATE_PATH.read_text(encoding="utf-8")
    POSTS_DIR.mkdir(exist_ok=True)
    slugs_vistos = {n["slug"] for n in noticias}
    escritos = 0
    for n in noticias:
        try:
            html_out = render_post_html(n, plantilla, noticias)
            (POSTS_DIR / f"{n['slug']}.html").write_text(html_out, encoding="utf-8")
            escritos += 1
        except Exception as e:
            log.error("Error renderizando post %s: %s", n.get("slug"), e)
    for f in POSTS_DIR.glob("*.html"):
        if f.stem not in slugs_vistos:
            f.unlink()
            log.info("Post huérfano eliminado: %s", f.name)
    return escritos


# ============================================================
# RENDER: feed.xml
# ============================================================
def render_feed(noticias: List[Dict[str, Any]]) -> int:
    items = noticias[:FEED_MAX_ITEMS]
    now_rfc = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
        '  <channel>',
        '    <title>ABISMOX // Gaming + Tech Archive</title>',
        f'    <link>{xml_escape(SITE_BASE_URL)}</link>',
        '    <description>Archivo automático de noticias gaming + tecnología. Pixel art, nostalgia y futuro digital.</description>',
        f'    <atom:link href="{xml_escape(SITE_BASE_URL)}feed.xml" rel="self" type="application/rss+xml"/>',
        '    <language>es-es</language>',
        '    <lastBuildDate>' + now_rfc + '</lastBuildDate>',
        '    <generator>ABISMOX build.py</generator>',
    ]
    for n in items:
        link = SITE_BASE_URL + url_post(n["slug"])
        guid = link
        pub = parse_pub_date_to_rfc(n.get("fecha", ""))
        title = xml_escape(n["titulo"])
        desc = xml_escape(n.get("preview", "") or n.get("contenido", "")[:300])
        cat = categoria_titulo(n.get("categoria", ""))
        parts += [
            '    <item>',
            f'      <title>{title}</title>',
            f'      <link>{xml_escape(link)}</link>',
            f'      <guid isPermaLink="true">{xml_escape(guid)}</guid>',
            f'      <pubDate>{pub}</pubDate>',
            f'      <category>{xml_escape(cat)}</category>',
            f'      <description>{desc}</description>',
            '    </item>',
        ]
    parts += ['  </channel>', '</rss>']
    FEED_PATH.write_text("\n".join(parts), encoding="utf-8")
    return len(items)


def parse_pub_date_to_rfc(fecha_iso: str) -> str:
    try:
        dt = datetime.fromisoformat(fecha_iso).replace(tzinfo=timezone.utc)
        return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")
    except Exception:
        return datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")


# ============================================================
# RENDER: sitemap.xml
# ============================================================
def render_sitemap(noticias: List[Dict[str, Any]]) -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        f'    <loc>{xml_escape(SITE_BASE_URL)}</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
    ]
    for n in noticias:
        link = SITE_BASE_URL + url_post(n["slug"])
        lastmod = n.get("fecha") or today
        parts += [
            '  <url>',
            f'    <loc>{xml_escape(link)}</loc>',
            f'    <lastmod>{lastmod}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.8</priority>',
            '  </url>',
        ]
    parts.append('</urlset>')
    SITEMAP_PATH.write_text("\n".join(parts), encoding="utf-8")
    return len(noticias) + 1


# ============================================================
# RENDER: robots.txt
# ============================================================
def render_robots() -> None:
    contenido = (
        "User-agent: *\n"
        "Allow: /\n"
        f"Sitemap: {SITE_BASE_URL}sitemap.xml\n"
    )
    ROBOTS_PATH.write_text(contenido, encoding="utf-8")


# ============================================================
# MAIN
# ============================================================
def main() -> int:
    parser = argparse.ArgumentParser(description="ABISMOX build script")
    parser.add_argument("--dry-run", action="store_true", help="no escribe archivos, solo log")
    parser.add_argument("--only-render", action="store_true", help="solo renderiza desde data/noticias.json")
    parser.add_argument("--only-fetch", action="store_true", help="solo actualiza data/noticias.json")
    parser.add_argument("--site-url", default=None, help="override SITE_BASE_URL")
    args = parser.parse_args()

    if args.site_url:
        global SITE_BASE_URL
        SITE_BASE_URL = args.site_url.rstrip("/") + "/"

    if load_dotenv is not None:
        env_path = ROOT / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            log.info("Cargado .env")

    if args.only_render:
        if not DATA_PATH.exists():
            log.error("No existe data/noticias.json y se pidió --only-render")
            return 1
        data = leer_json(DATA_PATH)
        noticias = [validar_noticia(n) for n in data.get("noticias", [])]
        noticias = [n for n in noticias if n]
        noticias = dedupe_y_orden(noticias)
        noticias = aplicar_cap(noticias)
    else:
        noticias = fetch_noticias(args.dry_run)
        if not args.dry_run:
            escribir_json(DATA_PATH, {"noticias": noticias})
            log.info("data/noticias.json actualizado: %d entradas", len(noticias))

    if args.dry_run:
        log.info("DRY-RUN: no se escriben archivos")
        return 0

    if args.only_fetch:
        log.info("--only-fetch: data/noticias.json actualizado, no se renderiza")
        return 0

    n_posts = render_posts(noticias)
    n_feed = render_feed(noticias)
    n_sitemap = render_sitemap(noticias)
    render_robots()
    log.info("Render: %d posts, %d feed items, %d sitemap urls", n_posts, n_feed, n_sitemap)
    log.info("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
