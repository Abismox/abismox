/* ============================================
   ABISMOX // main.js
   Carga, búsqueda, renderizado y compartir
   ============================================ */


/* ============== VARIABLES GLOBALES ============== */
let allNoticias = [];
let currentFilter = 'todos';
let currentQuery = '';
let refreshInterval = null;
let searchDebounce = null;

const JSON_URL = './data/noticias.json';
const REFRESH_TIME = 5 * 60 * 1000; // 5 minutos en ms
const CONTENT_PREVIEW_LENGTH = 300;
const WORDS_PER_MINUTE = 200;


/* ============== CARGAR NOTICIAS ============== */
async function loadNoticias() {
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: No se pudo cargar el archivo`);
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.noticias)) {
            throw new Error('Formato JSON inválido: se esperaba { noticias: [] }');
        }
        const noticiasValidas = data.noticias
            .filter(n => n && n.titulo && n.fecha && n.slug)
            .map(n => ({
                ...n,
                _reading_time: calcularReadingTime(n.contenido || n.preview || '')
            }));
        allNoticias = noticiasValidas.sort((a, b) => {
            const dateA = new Date(a.fecha).getTime() || 0;
            const dateB = new Date(b.fecha).getTime() || 0;
            return dateB - dateA;
        });
        return allNoticias;
    } catch (error) {
        console.error('[ABISMOX] Error al cargar noticias:', error);
        renderError(error.message);
        allNoticias = [];
        return [];
    }
}


/* ============== RENDERIZAR FEED ============== */
function renderFeed(filtro = 'todos', query = '') {
    const feed = document.getElementById('feed');
    if (!feed) return;

    currentFilter = filtro;
    currentQuery = query;

    const q = query.trim().toLowerCase();
    let noticiasFiltradas = filtro === 'todos'
        ? allNoticias
        : allNoticias.filter(n => n.categoria === filtro);

    if (q) {
        noticiasFiltradas = noticiasFiltradas.filter(n => {
            const haystack = [
                n.titulo || '',
                n.preview || '',
                n.contenido || '',
                n.categoria || ''
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }

    feed.innerHTML = '';
    feed.setAttribute('aria-busy', 'false');
    updateFeedStats(noticiasFiltradas.length);

    if (noticiasFiltradas.length === 0) {
        feed.innerHTML = renderEmptyState(filtro, q);
        return;
    }

    const fragment = document.createDocumentFragment();
    noticiasFiltradas.forEach(noticia => {
        fragment.appendChild(createNoticiaCard(noticia));
    });
    feed.appendChild(fragment);
}


/* ============== ACTUALIZAR ESTADÍSTICAS ============== */
function updateFeedStats(count) {
    const statCount = document.getElementById('stat-count');
    if (statCount) statCount.textContent = count;

    const categorias = new Set(allNoticias.map(n => n.categoria).filter(Boolean));
    const statCat = document.getElementById('stat-cat');
    if (statCat) statCat.textContent = categorias.size;
}


/* ============== CREAR TARJETA DE NOTICIA ============== */
function createNoticiaCard(noticia) {
    const article = document.createElement('article');
    article.className = 'noticia-card';
    article.dataset.categoria = noticia.categoria || 'general';

    if (noticia.color && isValidColor(noticia.color)) {
        article.style.setProperty('--card-color', noticia.color);
        article.style.borderLeftColor = noticia.color;
        article.style.borderColor = noticia.color;
    }

    // Badge
    const badge = document.createElement('span');
    badge.className = `badge ${noticia.categoria || 'general'}`;
    badge.textContent = formatCategory(noticia.categoria);
    article.appendChild(badge);

    // Título
    const titulo = document.createElement('h2');
    titulo.className = 'card-titulo';
    titulo.textContent = noticia.titulo;
    article.appendChild(titulo);

    // Preview
    if (noticia.preview) {
        const preview = document.createElement('p');
        preview.className = 'card-preview';
        preview.textContent = noticia.preview;
        article.appendChild(preview);
    }

    // Contenido parcial
    if (noticia.contenido) {
        const contenido = document.createElement('p');
        contenido.className = 'card-contenido';
        const texto = noticia.contenido.substring(0, CONTENT_PREVIEW_LENGTH);
        contenido.textContent = texto.length < noticia.contenido.length
            ? texto + '...'
            : texto;
        article.appendChild(contenido);
    }

    // Meta: fecha + reading time + fuente
    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const fecha = document.createElement('time');
    fecha.className = 'meta-fecha';
    if (noticia.fecha) {
        fecha.dateTime = noticia.fecha;
        fecha.textContent = formatDate(noticia.fecha);
    } else {
        fecha.textContent = '----';
    }
    meta.appendChild(fecha);

    meta.appendChild(makeSep());

    const lectura = document.createElement('span');
    lectura.className = 'meta-lectura';
    lectura.textContent = `▓ ${noticia._reading_time || 1} MIN`;
    meta.appendChild(lectura);

    if (noticia.fuente) {
        meta.appendChild(makeSep());
        const fuente = document.createElement('span');
        fuente.className = `meta-fuente ${noticia.es_auto ? 'auto' : ''}`;
        fuente.textContent = noticia.es_auto ? 'FUENTE: AGENTE' : 'FUENTE: MANUAL';
        meta.appendChild(fuente);
    }

    article.appendChild(meta);

    // Acciones: leer más (interno o externo) + compartir
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const slug = noticia.slug || '';
    const internalUrl = slug ? `posts/${slug}.html` : null;

    if (noticia.link_externo && isValidUrl(noticia.link_externo)) {
        const link = document.createElement('a');
        link.className = 'card-cta';
        link.href = noticia.link_externo;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'LEER MÁS';
        link.setAttribute('aria-label', `Leer más sobre: ${noticia.titulo}`);
        actions.appendChild(link);

        if (internalUrl) {
            const interno = document.createElement('a');
            interno.className = 'card-cta';
            interno.href = internalUrl;
            interno.textContent = 'ARCHIVO';
            interno.setAttribute('aria-label', `Ver en archivo: ${noticia.titulo}`);
            actions.appendChild(interno);
        }
    } else if (internalUrl) {
        const link = document.createElement('a');
        link.className = 'card-cta';
        link.href = internalUrl;
        link.textContent = 'LEER ARCHIVO';
        link.setAttribute('aria-label', `Leer en archivo: ${noticia.titulo}`);
        actions.appendChild(link);
    } else {
        const span = document.createElement('span');
        span.className = 'card-cta internal';
        span.textContent = 'ARCHIVO INTERNO';
        actions.appendChild(span);
    }

    // Botón compartir
    const share = document.createElement('button');
    share.className = 'share-btn';
    share.type = 'button';
    share.textContent = '▓ COMPARTIR';
    share.setAttribute('aria-label', `Compartir: ${noticia.titulo}`);
    share.addEventListener('click', () => shareNoticia(noticia, internalUrl));
    actions.appendChild(share);

    article.appendChild(actions);
    return article;
}


function makeSep() {
    const sep = document.createElement('span');
    sep.className = 'meta-sep';
    sep.textContent = '//';
    sep.setAttribute('aria-hidden', 'true');
    return sep;
}


/* ============== COMPARTIR ============== */
function shareNoticia(noticia, internalUrl) {
    const baseEl = document.querySelector('base');
    const baseHref = baseEl ? baseEl.getAttribute('href') : './';
    const url = internalUrl
        ? new URL(internalUrl, window.location.href.replace(/[^/]*$/, '') + baseHref).toString()
        : window.location.href;

    const shareData = {
        title: noticia.titulo,
        text: noticia.preview || noticia.titulo,
        url: url
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            fallbackShare(shareData.title, url);
        });
    } else {
        fallbackShare(shareData.title, url);
    }
}

function fallbackShare(title, url) {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}


/* ============== ESTADO VACÍO ============== */
function renderEmptyState(filtro, query) {
    if (query) {
        return `<p class="empty-state search-empty">
            &gt; SIN RESULTADOS PARA "<span class="search-query">${escapeHtml(query)}</span>"
        </p>`;
    }
    const mensaje = filtro === 'todos'
        ? '&gt; NO HAY NOTICIAS DISPONIBLES AÚN'
        : `&gt; NO HAY NOTICIAS DE "${filtro.toUpperCase()}"`;
    return `<p class="empty-state">${mensaje}</p>`;
}


/* ============== RENDERIZAR ERROR ============== */
function renderError(message) {
    const feed = document.getElementById('feed');
    if (!feed) return;
    feed.setAttribute('aria-busy', 'false');
    feed.innerHTML = `
        <div class="error-state" role="alert">
            <p>&gt; ERROR AL CARGAR NOTICIAS</p>
            <p class="error-msg">${escapeHtml(message)}</p>
        </div>
    `;
}


/* ============== CONFIGURAR FILTROS ============== */
function setupFilters() {
    const buttons = document.querySelectorAll('.filtro-btn');
    if (buttons.length === 0) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filtro = btn.dataset.filter || 'todos';
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            renderFeed(filtro, currentQuery);
        });
    });
}


/* ============== CONFIGURAR BÚSQUEDA ============== */
function setupSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    if (!input) return;

    input.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            const q = input.value;
            if (clearBtn) clearBtn.hidden = q.length === 0;
            renderFeed(currentFilter, q);
        }, 150);
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.hidden = true;
            renderFeed(currentFilter, '');
            input.focus();
        });
    }

    // Atajo: "/" enfoca búsqueda (estilo vim)
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            input.focus();
        }
        if (e.key === 'Escape' && document.activeElement === input) {
            input.value = '';
            if (clearBtn) clearBtn.hidden = true;
            renderFeed(currentFilter, '');
            input.blur();
        }
    });
}


/* ============== LEER QUERY DE URL ============== */
function leerQueryDeURL() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('q') || '';
    } catch {
        return '';
    }
}


/* ============== AUTO-REFRESH ============== */
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
        await loadNoticias();
        renderFeed(currentFilter, currentQuery);
    }, REFRESH_TIME);
}


/* ============== HELPERS ============== */
function calcularReadingTime(texto) {
    if (!texto) return 1;
    const palabras = (texto.match(/\S+/g) || []).length;
    return Math.max(1, Math.round(palabras / WORDS_PER_MINUTE));
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

function formatCategory(categoria) {
    if (!categoria) return 'GENERAL';
    return categoria.toUpperCase();
}

function isValidColor(color) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color) ||
           /^rgb\(/i.test(color) ||
           /^hsl\(/i.test(color);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


/* ============== INICIALIZACIÓN ============== */
document.addEventListener('DOMContentLoaded', async () => {
    const initialQuery = leerQueryDeURL();
    const searchInput = document.getElementById('search-input');
    if (searchInput && initialQuery) {
        searchInput.value = initialQuery;
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) clearBtn.hidden = false;
    }

    await loadNoticias();
    setupFilters();
    setupSearch();
    renderFeed('todos', initialQuery);
    startAutoRefresh();
});