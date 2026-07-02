/* ============================================
   ABISMOX // main.js
   v2.1 // Cartridge Carousel + Featured Panel
        + Boot sequence + Glitch + Stars + Aurora
        + Tilt 3D + Sound + Counter + Tooltips
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
let audioCtx = null;
let soundEnabled = false;
let bootSequenceDone = false;

const JSON_URL = './data/noticias.json';
const REFRESH_TIME = 5 * 60 * 1000;
const CONTENT_PREVIEW_LENGTH = 300;
const WORDS_PER_MINUTE = 200;
const STORAGE_KEY_SOUND = 'abismox_sound';
const BOOT_DURATION_MS = 900;


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
    renderFeatured(filteredNoticias[activeIndex], false);
    renderRail(filteredNoticias);
    updateArrowsState();
}


/* ============== RENDER FEATURED PANEL ============== */
function renderFeatured(noticia, animate = true) {
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

    const apply = () => {
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
                ${internalUrl ? `<a class="card-cta" href="${escapeAttr(internalUrl)}" aria-label="Leer archivo completo: ${escapeAttr(noticia.titulo)}">LEER ARCHIVO</a>` : ''}
                ${hasExternal ? `<a class="card-cta secondary" href="${escapeAttr(noticia.link_externo)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir fuente original">FUENTE ORIGINAL</a>` : ''}
                <button class="share-btn" id="featured-share-btn" type="button" aria-label="Compartir: ${escapeAttr(noticia.titulo)}">▓ COMPARTIR</button>
            </div>
        `;

        const shareBtn = document.getElementById('featured-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                playClick();
                shareNoticia(noticia, internalUrl);
            });
        }

        if (animate) {
            const titulo = panel.querySelector('.featured-titulo');
            if (titulo) {
                titulo.classList.remove('is-glitch');
                void titulo.offsetWidth;
                titulo.classList.add('is-glitch');
            }
            panel.classList.remove('is-tearing');
            void panel.offsetWidth;
            panel.classList.add('is-tearing');
            setTimeout(() => panel.classList.remove('is-tearing'), 220);
        }
    };

    if (!animate) {
        apply();
        return;
    }

    panel.classList.add('is-changing');
    setTimeout(() => {
        apply();
        panel.classList.remove('is-changing');
        panel.classList.add('is-entering');
        setTimeout(() => panel.classList.remove('is-entering'), 260);
    }, 140);
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

    const cat = formatCategory(noticia.categoria);
    const tooltipText = `${cat} · ${escapeAttr(noticia.titulo.substring(0, 40))}${noticia.titulo.length > 40 ? '...' : ''}`;

    card.innerHTML = `
        <div class="cartridge__label">
            <span class="cartridge__cat">${escapeHtml(cat)}</span>
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
    card.setAttribute('data-tip', tooltipText);
    card.setAttribute('data-tip-pos', 'top');

    card.addEventListener('click', () => {
        playClick();
        focusCartridge(index);
    });
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            playClick();
            focusCartridge(index);
        }
    });

    /* Hover 3D tilt */
    card.addEventListener('mousemove', (e) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const maxTilt = 8;
        const isActive = card.classList.contains('is-active');
        const baseTransform = isActive
            ? `scale(1.08) translateY(-4px)`
            : `translateY(-6px)`;
        card.classList.add('is-tilting');
        card.style.transform = `${baseTransform} rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.classList.remove('is-tilting');
        card.style.transform = '';
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

    playInsert();
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

    const dismissSwipeHint = () => hideSwipeHint();

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            dismissSwipeHint();
            if (activeIndex > 0) focusCartridge(activeIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            dismissSwipeHint();
            if (activeIndex < filteredNoticias.length - 1) focusCartridge(activeIndex + 1);
        });
    }

    const rail = document.getElementById('cartridge-rail');
    if (rail) {
        rail.addEventListener('scroll', dismissSwipeHint, { passive: true });
        rail.addEventListener('touchstart', dismissSwipeHint, { passive: true });
    }
}


/* ============== HIDE SWIPE HINT ============== */
let swipeHintHidden = false;
function hideSwipeHint() {
    if (swipeHintHidden) return;
    swipeHintHidden = true;
    const hint = document.getElementById('swipe-hint');
    if (hint) hint.classList.add('is-hidden');
}


/* ============== ACTUALIZAR ESTADÍSTICAS ============== */
function updateFeedStats(count) {
    const statCount = document.getElementById('stat-count');
    if (statCount) animateCounter(statCount, count);

    const categorias = new Set(allNoticias.map(n => n.categoria).filter(Boolean));
    const statCat = document.getElementById('stat-cat');
    if (statCat) animateCounter(statCat, categorias.size);
}


/* ============== COUNTER ANIMADO 0 → N ============== */
function animateCounter(el, target, duration = 700) {
    if (!el) return;
    const start = parseInt(el.textContent, 10) || 0;
    if (start === target) return;
    const startTime = performance.now();

    el.classList.add('is-counting');
    setTimeout(() => el.classList.remove('is-counting'), duration + 50);

    const step = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.round(start + (target - start) * eased);
        el.textContent = current;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target;
    };
    requestAnimationFrame(step);
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
            if (btn.classList.contains('active')) return;
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            playFilter();
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


/* ============================================
   v2.1 // NUEVAS FEATURES
   ============================================ */


/* ============== BOOT SEQUENCE ============== */
function runBootSequence() {
    const overlay = document.getElementById('boot-overlay');
    if (!overlay) return;

    /* Si reduced-motion, saltar todo */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        overlay.style.display = 'none';
        runMemoryCheck();
        bootSequenceDone = true;
        return;
    }

    /* Iniciar memory check en paralelo (mensajes en el panel) */
    runMemoryCheck();

    /* Tras 320ms, marcar como done para que haga fade */
    setTimeout(() => {
        overlay.classList.add('is-done');
    }, 320);

    /* Tras 900ms total, ocultar completamente y marcar flag */
    setTimeout(() => {
        overlay.style.display = 'none';
        bootSequenceDone = true;
        playBootSound();
    }, BOOT_DURATION_MS);
}


/* ============== MEMORY CHECK (loading BIOS-style) ============== */
const BOOT_MESSAGES = [
    { text: 'ABISMOX OS v2.1 // CARTRIDGE BAY', cls: '' },
    { text: 'INITIALIZING SYSTEM............ OK', cls: 'boot-msg--ok', delay: 320 },
    { text: 'SCANNING RSS FEEDS [4/4]....... OK', cls: 'boot-msg--ok', delay: 280 },
    { text: 'LOADING NEURAL NETWORK......... OK', cls: 'boot-msg--ok', delay: 260 },
    { text: 'CHECKING ARCHIVE INTEGRITY..... OK', cls: 'boot-msg--ok', delay: 240 },
    { text: 'CARTRIDGE BAY EMPTY // WAITING', cls: 'boot-msg--warn', delay: 220 },
    { text: '> READY // INSERT A CARTRIDGE', cls: 'boot-msg--ready', delay: 200 }
];

function runMemoryCheck() {
    const container = document.getElementById('boot-messages');
    if (!container) return;
    container.innerHTML = '';

    BOOT_MESSAGES.forEach((msg, i) => {
        const el = document.createElement('div');
        el.className = `boot-msg ${msg.cls || ''}`;
        el.textContent = msg.text;
        el.style.animationDelay = `${i * (msg.delay || 220)}ms`;
        container.appendChild(el);
    });

    /* Tras todos los mensajes, el panel quedará con "READY"
       y luego será reemplazado por el featured real cuando llegue la data */
}


/* ============== ESTRELLAS (twinkle) ============== */
function generateStars(count) {
    const layer = document.getElementById('stars-layer');
    if (!layer) return;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        const isBig = Math.random() < 0.15;
        star.className = isBig ? 'star star--big' : 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty('--dur', `${(2 + Math.random() * 4).toFixed(2)}s`);
        star.style.setProperty('--delay', `${(Math.random() * 4).toFixed(2)}s`);
        star.style.setProperty('--peak', (0.5 + Math.random() * 0.5).toFixed(2));
        fragment.appendChild(star);
    }
    layer.appendChild(fragment);
}


/* ============== AUDIO (Web Audio API) ============== */
function getAudioCtx() {
    if (audioCtx) return audioCtx;
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
        return audioCtx;
    } catch {
        return null;
    }
}

function playTone(freq, duration = 60, type = 'square', volume = 0.04) {
    if (!soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration / 1000 + 0.01);
    } catch (e) {
        /* Silenciar errores de audio */
    }
}

/* Beep de boot (acorde de power-on) */
function playBootSound() {
    if (!soundEnabled) return;
    playTone(440, 80, 'square', 0.03);
    setTimeout(() => playTone(660, 80, 'square', 0.03), 90);
    setTimeout(() => playTone(880, 120, 'square', 0.03), 180);
}

/* Click genérico (botón, filtro) */
function playClick() {
    if (!soundEnabled) return;
    playTone(880, 35, 'square', 0.025);
}

/* Sonido al cambiar de cartucho (insert) */
function playInsert() {
    if (!soundEnabled) return;
    playTone(220, 50, 'square', 0.03);
    setTimeout(() => playTone(440, 40, 'square', 0.03), 40);
}

/* Sonido al cambiar filtro (más agudo) */
function playFilter() {
    if (!soundEnabled) return;
    playTone(1320, 50, 'square', 0.025);
    setTimeout(() => playTone(1760, 60, 'square', 0.025), 50);
}

/* Hover en cartucho (muy sutil) */
function playHover() {
    if (!soundEnabled) return;
    playTone(2200, 12, 'sine', 0.01);
}


/* ============== SOUND TOGGLE ============== */
function loadSoundPreference() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SOUND);
        soundEnabled = stored === '1';
    } catch {
        soundEnabled = false;
    }
}

function saveSoundPreference() {
    try {
        localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled ? '1' : '0');
    } catch {
        /* Sin storage disponible */
    }
}

function setupSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;

    updateSoundToggleUI();

    btn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        saveSoundPreference();
        updateSoundToggleUI();
        if (soundEnabled) {
            /* Test beep al activar */
            playTone(660, 80, 'square', 0.03);
        }
    });
}

function updateSoundToggleUI() {
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.classList.toggle('is-muted', !soundEnabled);
    btn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    btn.setAttribute('data-tip', soundEnabled ? 'SONIDO ON' : 'SONIDO OFF');
}


/* ============== INICIALIZACIÓN ============== */
document.addEventListener('DOMContentLoaded', async () => {
    /* 1) Restaurar preferencia de sonido */
    loadSoundPreference();

    /* 2) Generar estrellas de fondo */
    generateStars(60);

    /* 3) Setup sound toggle */
    setupSoundToggle();

    /* 4) Boot sequence (overlay + memory check en paralelo) */
    runBootSequence();

    /* 5) Inicialización normal (no espera al boot) */
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