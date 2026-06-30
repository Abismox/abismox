/* ============================================
   ABISMOX // main.js
   v2.0 // Cartridge Carousel + Featured Panel
   ============================================ */


/* ============== VARIABLES GLOBALES ============== */
let allNoticias = [];
let filteredNoticias = [];
let currentFilter = 'todos';
let currentQuery = '';
let activeIndex = 0;
let refreshInterval = null;
let searchDebounce = null;
let observer = null;
let isProgrammaticScroll = false;

const JSON_URL = './data/noticias.json';
const REFRESH_TIME = 5 * 60 * 1000;
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


/* ============== RENDERIZAR FEED (carrusel + featured) ============== */
function renderFeed(filtro = 'todos', query = '') {
    const featuredPanel = document.getElementById('featured-panel');
    const rail = document.getElementById('cartridge-rail');
    if (!featuredPanel || !rail) return;

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

    filteredNoticias = noticiasFiltradas;
    updateFeedStats(filteredNoticias.length);

    if (filteredNoticias.length === 0) {
        featuredPanel.innerHTML = renderEmptyFeatured(filtro, q);
        rail.innerHTML = '<div class="rail-empty">&gt; NO HAY CARTUCHOS EN ESTA SECCIÓN</div>';
        renderDots(0);
        updateArrowsState();
        return;
    }

    activeIndex = 0;
    renderFeatured(filteredNoticias[activeIndex]);
    renderRail(filteredNoticias);
    updateArrowsState();
}


/* ============== RENDER FEATURED PANEL ============== */
function renderFeatured(noticia) {
    const panel = document.getElementById('featured-panel');
    if (!panel || !noticia) return;

    const color = (noticia.color && isValidColor(noticia.color)) ? noticia.color : '#FF1493';
    const colorGlow = hexToRgba(color, 0.18);

    panel.style.setProperty('--card-color', color);
    panel.style.setProperty('--card-color-glow', colorGlow);

    const internalUrl = noticia.slug ? `posts/${noticia.slug}.html` : null;
    const hasExternal = noticia.link_externo && isValidUrl(noticia.link_externo);

    const contenido = noticia.contenido
        ? (noticia.contenido.length > CONTENT_PREVIEW_LENGTH
            ? noticia.contenido.substring(0, CONTENT_PREVIEW_LENGTH) + '...'
            : noticia.contenido)
        : (noticia.preview || '');

    panel.innerHTML = `
        <div class="featured-meta">
            <span class="badge ${escapeAttr(noticia.categoria || 'general')}">${escapeHtml(formatCategory(noticia.categoria))}</span>
            <time class="meta-fecha" datetime="${escapeAttr(noticia.fecha)}">${escapeHtml(formatDate(noticia.fecha))}</time>
            <span class="meta-sep" aria-hidden="true">//</span>
            <span class="meta-lectura">▓ ${noticia._reading_time || 1} MIN</span>
            ${noticia.fuente ? `<span class="meta-sep" aria-hidden="true">//</span><span class="meta-fuente ${noticia.es_auto ? 'auto' : ''}">${noticia.es_auto ? 'FUENTE: AGENTE' : 'FUENTE: MANUAL'}</span>` : ''}
        </div>
        <h2 class="featured-titulo">${escapeHtml(noticia.titulo)}</h2>
        ${noticia.preview ? `<p class="featured-preview">${escapeHtml(noticia.preview)}</p>` : ''}
        ${contenido ? `<p class="featured-contenido">${escapeHtml(contenido)}</p>` : ''}
        <div class="featured-actions">
            ${internalUrl ? `<a class="card-cta" href="${internalUrl}" aria-label="Leer archivo completo: ${escapeAttr(noticia.titulo)}">LEER ARCHIVO</a>` : ''}
            ${hasExternal ? `<a class="card-cta secondary" href="${escapeAttr(noticia.link_externo)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir fuente original">FUENTE ORIGINAL</a>` : ''}
            <button class="share-btn" id="featured-share-btn" type="button" aria-label="Compartir: ${escapeAttr(noticia.titulo)}">▓ COMPARTIR</button>
        </div>
    `;

    const shareBtn = document.getElementById('featured-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => shareNoticia(noticia, internalUrl));
    }
}


/* ============== RENDER EMPTY FEATURED ============== */
function renderEmptyFeatured(filtro, query) {
    if (query) {
        return `<div class="featured-loading">
            &gt; SIN RESULTADOS PARA "<span style="color: var(--verde)">${escapeHtml(query)}</span>"
        </div>`;
    }
    const msg = filtro === 'todos'
        ? '&gt; NO HAY NOTICIAS DISPONIBLES AÚN'
        : `&gt; NO HAY NOTICIAS DE "${(filtro || '').toUpperCase()}"`;
    return `<div class="featured-loading">${msg}</div>`;
}


/* ============== RENDER CARRUSEL DE CARTRIDGES ============== */
function renderRail(noticias) {
    const rail = document.getElementById('cartridge-rail');
    if (!rail) return;

    rail.innerHTML = '';
    const fragment = document.createDocumentFragment();
    noticias.forEach((noticia, i) => {
        fragment.appendChild(createCartridge(noticia, i));
    });
    rail.appendChild(fragment);

    renderDots(noticias.length);
    setupIntersectionObserver();
    updateActiveCartridge(0, false);
}


/* ============== CREAR CARTRIDGE ============== */
function createCartridge(noticia, index) {
    const card = document.createElement('article');
    card.className = 'cartridge';
    card.dataset.index = index;
    card.dataset.categoria = noticia.categoria || 'general';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');

    if (noticia.color && isValidColor(noticia.color)) {
        card.style.setProperty('--cart-color', noticia.color);
    }

    card.innerHTML = `
        <div class="cartridge__label">
            <span class="cartridge__cat">${escapeHtml(formatCategory(noticia.categoria))}</span>
            <span class="cartridge__date">${escapeHtml(formatDate(noticia.fecha))}</span>
        </div>
        <div class="cartridge__body">
            <h3 class="cartridge__title">${escapeHtml(noticia.titulo)}</h3>
            ${noticia.preview ? `<p class="cartridge__preview">${escapeHtml(noticia.preview)}</p>` : ''}
        </div>
        <div class="cartridge__footer">
            <span class="cartridge__time">▓ ${noticia._reading_time || 1} MIN</span>
            <span class="cartridge__source ${noticia.es_auto ? '' : 'manual'}">${noticia.es_auto ? 'AUTO' : 'MANUAL'}</span>
        </div>
    `;

    card.addEventListener('click', () => focusCartridge(index));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            focusCartridge(index);
        }
    });

    return card;
}


/* ============== FOCUS CARTRIDGE (center + update featured) ============== */
function focusCartridge(index) {
    if (index < 0 || index >= filteredNoticias.length) return;
    const rail = document.getElementById('cartridge-rail');
    const cards = rail ? rail.querySelectorAll('.cartridge') : [];
    const target = cards[index];
    if (!target) return;

    isProgrammaticScroll = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    setTimeout(() => {
        isProgrammaticScroll = false;
    }, 500);

    updateActiveCartridge(index, true);
}


/* ============== INTERSECTION OBSERVER (sync scroll → featured) ============== */
function setupIntersectionObserver() {
    const rail = document.getElementById('cartridge-rail');
    if (!rail) return;

    if (observer) observer.disconnect();

    const cards = rail.querySelectorAll('.cartridge');
    if (cards.length === 0) return;

    observer = new IntersectionObserver((entries) => {
        if (isProgrammaticScroll) return;

        let closestCard = null;
        let closestDistance = Infinity;

        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const rect = entry.bounds;
            const railRect = rail.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const railCenter = railRect.left + railRect.width / 2;
            const distance = Math.abs(cardCenter - railCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCard = entry.target;
            }
        });

        if (closestCard) {
            const idx = parseInt(closestCard.dataset.index, 10);
            if (!isNaN(idx) && idx !== activeIndex) {
                updateActiveCartridge(idx, true);
            }
        }
    }, {
        root: rail,
        threshold: [0.5, 0.6, 0.7, 0.8, 0.9],
        rootMargin: '0px'
    });

    cards.forEach(card => observer.observe(card));
}


/* ============== UPDATE ACTIVE CARTRIDGE ============== */
function updateActiveCartridge(index, updateFeatured = true) {
    if (index < 0 || index >= filteredNoticias.length) return;
    activeIndex = index;

    const cards = document.querySelectorAll('.cartridge');
    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.add('is-active');
            card.setAttribute('aria-current', 'true');
        } else {
            card.classList.remove('is-active');
            card.removeAttribute('aria-current');
        }
    });

    if (updateFeatured) {
        renderFeatured(filteredNoticias[index]);
    }

    updateDotsActive(index);
    updateArrowsState();
}


/* ============== RENDER DOTS ============== */
function renderDots(count) {
    const dotsContainer = document.getElementById('rail-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = 'rail-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ir al cartucho ${i + 1}`);
        dot.dataset.index = i;
        dot.addEventListener('click', () => focusCartridge(i));
        dotsContainer.appendChild(dot);
    }
    updateDotsActive(0);
}


/* ============== UPDATE DOTS ACTIVE ============== */
function updateDotsActive(index) {
    const dots = document.querySelectorAll('.rail-dot');
    dots.forEach((dot, i) => {
        if (i === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}


/* ============== ARROWS STATE ============== */
function updateArrowsState() {
    const prevBtn = document.getElementById('rail-prev');
    const nextBtn = document.getElementById('rail-next');
    const total = filteredNoticias.length;

    if (prevBtn) prevBtn.disabled = total === 0 || activeIndex <= 0;
    if (nextBtn) nextBtn.disabled = total === 0 || activeIndex >= total - 1;
}


/* ============== SETUP ARROWS ============== */
function setupArrows() {
    const prevBtn = document.getElementById('rail-prev');
    const nextBtn = document.getElementById('rail-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (activeIndex > 0) focusCartridge(activeIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (activeIndex < filteredNoticias.length - 1) focusCartridge(activeIndex + 1);
        });
    }
}


/* ============== ACTUALIZAR ESTADÍSTICAS ============== */
function updateFeedStats(count) {
    const statCount = document.getElementById('stat-count');
    if (statCount) statCount.textContent = count;

    const categorias = new Set(allNoticias.map(n => n.categoria).filter(Boolean));
    const statCat = document.getElementById('stat-cat');
    if (statCat) statCat.textContent = categorias.size;
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


/* ============== RENDERIZAR ERROR ============== */
function renderError(message) {
    const featured = document.getElementById('featured-panel');
    const rail = document.getElementById('cartridge-rail');
    if (featured) {
        featured.innerHTML = `
            <div class="featured-loading" style="color: var(--rojo); border: 2px dashed var(--rojo); padding: 40px 20px;">
                &gt; ERROR AL CARGAR NOTICIAS<br>
                <span style="color: var(--gris-claro); font-family: var(--font-cuerpo); font-size: 14px; margin-top: 12px; display: block;">${escapeHtml(message)}</span>
            </div>
        `;
    }
    if (rail) {
        rail.innerHTML = `<div class="rail-empty" style="border-color: var(--rojo); color: var(--rojo);">&gt; ERROR // ARCHIVO NO DISPONIBLE</div>`;
    }
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
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
            document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const direction = e.key === 'ArrowLeft' ? -1 : 1;
            const newIndex = activeIndex + direction;
            if (newIndex >= 0 && newIndex < filteredNoticias.length) {
                focusCartridge(newIndex);
            }
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
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function escapeAttr(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function hexToRgba(hex, alpha = 1) {
    if (!hex || hex.charAt(0) !== '#') return `rgba(255, 20, 147, ${alpha})`;
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    setupArrows();
    renderFeed('todos', initialQuery);
    startAutoRefresh();
});