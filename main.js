/* ============================================
   ABISMOX // main.js
   Carga y renderizado dinámico de noticias
   ============================================ */


/* ============== VARIABLES GLOBALES ============== */
let allNoticias = [];
let currentFilter = 'todos';
let refreshInterval = null;

const JSON_URL = '/data/noticias.json';
const REFRESH_TIME = 5 * 60 * 1000; // 5 minutos en ms
const CONTENT_PREVIEW_LENGTH = 300;


/* ============== CARGAR NOTICIAS ============== */
async function loadNoticias() {
    try {
        const response = await fetch(JSON_URL);

        // Validar respuesta HTTP
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: No se pudo cargar el archivo`);
        }

        const data = await response.json();

        // Validar estructura del JSON
        if (!data || !Array.isArray(data.noticias)) {
            throw new Error('Formato JSON inválido: se esperaba { noticias: [] }');
        }

        // Filtrar noticias válidas (con al menos titulo y fecha)
        const noticiasValidas = data.noticias.filter(n => n && n.titulo && n.fecha);

        // Ordenar por fecha descendente (más nuevas primero)
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
function renderFeed(filtro = 'todos') {
    const feed = document.getElementById('feed');
    if (!feed) {
        return;
    }

    currentFilter = filtro;

    // Filtrar noticias según categoría
    const noticiasFiltradas = filtro === 'todos'
        ? allNoticias
        : allNoticias.filter(n => n.categoria === filtro);

    // Limpiar feed y marcar como no ocupado
    feed.innerHTML = '';
    feed.setAttribute('aria-busy', 'false');

    // Actualizar estadísticas
    updateFeedStats(noticiasFiltradas.length);

    // Edge case: sin noticias
    if (noticiasFiltradas.length === 0) {
        feed.innerHTML = renderEmptyState(filtro);
        return;
    }

    // Renderizar cada noticia
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

    // Categorías únicas
    const categorias = new Set(allNoticias.map(n => n.categoria).filter(Boolean));
    const statCat = document.getElementById('stat-cat');
    if (statCat) statCat.textContent = categorias.size;
}


/* ============== CREAR TARJETA DE NOTICIA ============== */
function createNoticiaCard(noticia) {
    // Contenedor principal
    const article = document.createElement('article');
    article.className = 'noticia-card';
    article.dataset.categoria = noticia.categoria || 'general';

    // Color dinámico inline
    if (noticia.color && isValidColor(noticia.color)) {
        article.style.setProperty('--card-color', noticia.color);
        article.style.borderLeftColor = noticia.color;
        article.style.borderColor = noticia.color;
    }

    // Badge de categoría
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

    // Contenido parcial (primeras 300 caracteres)
    if (noticia.contenido) {
        const contenido = document.createElement('p');
        contenido.className = 'card-contenido';
        const texto = noticia.contenido.substring(0, CONTENT_PREVIEW_LENGTH);
        contenido.textContent = texto.length < noticia.contenido.length
            ? texto + '...'
            : texto;
        article.appendChild(contenido);
    }

    // Meta info: fecha + fuente
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

    if (noticia.fuente) {
        const sep1 = document.createElement('span');
        sep1.className = 'meta-sep';
        sep1.textContent = '//';
        sep1.setAttribute('aria-hidden', 'true');
        meta.appendChild(sep1);

        const fuente = document.createElement('span');
        fuente.className = `meta-fuente ${noticia.es_auto ? 'auto' : ''}`;
        fuente.textContent = noticia.es_auto ? 'FUENTE: AGENTE' : 'FUENTE: MANUAL';
        meta.appendChild(fuente);
    }

    article.appendChild(meta);

    // CTA: link externo o "ARCHIVO" si no hay
    if (noticia.link_externo && isValidUrl(noticia.link_externo)) {
        const link = document.createElement('a');
        link.className = 'card-cta';
        link.href = noticia.link_externo;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'LEER MÁS';
        link.setAttribute('aria-label', `Leer más sobre: ${noticia.titulo}`);
        article.appendChild(link);
    } else {
        const span = document.createElement('span');
        span.className = 'card-cta internal';
        span.textContent = 'ARCHIVO INTERNO';
        span.setAttribute('aria-label', 'Noticia sin enlace externo');
        article.appendChild(span);
    }

    return article;
}


/* ============== ESTADO VACÍO ============== */
function renderEmptyState(filtro) {
    const mensaje = filtro === 'todos'
        ? '> NO HAY NOTICIAS DISPONIBLES AÚN'
        : `> NO HAY NOTICIAS DE "${filtro.toUpperCase()}"`;
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

    if (buttons.length === 0) {
        return;
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filtro = btn.dataset.filter || 'todos';

            // Remover 'active' y aria-pressed de todos
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });

            // Agregar 'active' y aria-pressed al clickeado
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Re-renderizar feed
            renderFeed(filtro);
        });
    });
}


/* ============== AUTO-REFRESH ============== */
function startAutoRefresh() {
    // Evitar múltiples intervals
    if (refreshInterval) clearInterval(refreshInterval);

    refreshInterval = setInterval(async () => {
        await loadNoticias();
        renderFeed(currentFilter);
    }, REFRESH_TIME);
}


/* ============== HELPERS ============== */
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
    // Validación básica: hex, rgb, o nombre de color CSS
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
    // Cargar noticias
    await loadNoticias();

    // Configurar listeners de filtros
    setupFilters();

    // Render inicial con filtro "todos"
    renderFeed('todos');

    // Activar auto-refresh
    startAutoRefresh();
});
