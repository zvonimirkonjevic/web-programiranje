const PHP_API = 'http://localhost:8080';
const IMAGE_COUNT = 17;
const LOW_RATING_THRESHOLD = 5.0;
const STORAGE_KEY = 'imdb_watchlist';

let allMovies = [];
let sortDir = 'asc';
let currentUser = null;

function imgIndex(movieId) {
    return ((movieId - 1) % IMAGE_COUNT) + 1;
}

// ── Local-storage helpers (guest watchlist) ───────────────────────────────────

function getLocalIds() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]').map(String)); }
    catch { return new Set(); }
}

function persistLocalIds() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(watchlist)));
}

// ── Low-rating warning banner ─────────────────────────────────────────────────

function showLowRatingBanner(title, score) {
    let banner = document.getElementById('low-rating-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'low-rating-banner';
        banner.className = 'low-rating-banner';
        document.querySelector('.filters')?.insertAdjacentElement('afterend', banner)
            ?? document.body.prepend(banner);
    }
    banner.innerHTML = `
        <strong>Low Rating Warning</strong> — "${title}" has a score of
        <strong>${parseFloat(score).toFixed(1)}/10</strong>, which is below our recommended
        threshold of ${LOW_RATING_THRESHOLD}. It has been added to your library.
        <button class="low-rating-banner-close" onclick="this.parentElement.remove()">&#x2715;</button>
    `;
    banner.style.display = 'flex';
    clearTimeout(banner._timer);
    banner._timer = setTimeout(() => banner.remove(), 7000);
}

// ── Low-rating confirmation modal ─────────────────────────────────────────────

function showLowRatingModal(movie, onConfirm) {
    let backdrop = document.getElementById('low-rating-modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'low-rating-modal-backdrop';
        backdrop.className = 'low-rating-modal-backdrop';
        backdrop.innerHTML = `
            <div class="low-rating-modal" role="dialog" aria-modal="true">
                <div class="low-rating-modal-icon">&#9888;</div>
                <h2 class="low-rating-modal-title">Low Rating Warning</h2>
                <p class="low-rating-modal-body" id="low-rating-modal-body"></p>
                <div class="low-rating-modal-actions">
                    <button class="low-rating-btn-cancel" id="low-rating-cancel">Cancel</button>
                    <button class="low-rating-btn-confirm" id="low-rating-confirm">Add anyway</button>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
    }

    document.getElementById('low-rating-modal-body').innerHTML =
        `"<strong>${movie.title}</strong>" has a score of <strong>${parseFloat(movie.score).toFixed(1)}/10</strong>,`
        + ` which is below our recommended threshold of ${LOW_RATING_THRESHOLD}.<br><br>`
        + `Are you sure you want to add it to your library?`;

    backdrop.style.display = 'flex';

    function close() {
        backdrop.style.display = 'none';
        document.getElementById('low-rating-cancel').replaceWith(
            document.getElementById('low-rating-cancel').cloneNode(true)
        );
        document.getElementById('low-rating-confirm').replaceWith(
            document.getElementById('low-rating-confirm').cloneNode(true)
        );
    }

    document.getElementById('low-rating-cancel').addEventListener('click', close, { once: true });
    document.getElementById('low-rating-confirm').addEventListener('click', () => {
        close();
        onConfirm();
    }, { once: true });
}

// ── Movie rendering ───────────────────────────────────────────────────────────

function renderMovies(movies) {
    const tbody = document.querySelector('table tbody');
    document.getElementById('results-info').textContent =
        movies.length === 0 ? '' : `Showing ${movies.length} result${movies.length === 1 ? '' : 's'}`;

    if (movies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-gray);padding:30px;">No movies match your filters.</td></tr>';
        return;
    }
    tbody.innerHTML = movies.map((movie, index) => {
        const img   = imgIndex(movie.id);
        const score = parseFloat(movie.score ?? 0);
        const scoreCls = score < LOW_RATING_THRESHOLD ? 'score-low' : '';
        return `<tr>
            <td data-label="Poster"><img src="images/movie_${img}.png" alt="${movie.title}"></td>
            <td data-label="Rank">${index + 1}</td>
            <td data-label="Title">${movie.title}</td>
            <td data-label="Year">${movie.release_year}</td>
            <td data-label="Duration">${movie.duration_min}</td>
            <td data-label="Rating">${movie.rating}</td>
            <td data-label="Score"><span class="score-badge ${scoreCls}">${score.toFixed(1)}</span></td>
            <td data-label="Genre">${movie.genre}</td>
            <td data-label="Country">${movie.country || '—'}</td>
            <td data-label="Watchlist">
                <button class="btn-watchlist" data-img="${img}" data-id="${movie.id}">+ Watch</button>
            </td>
        </tr>`;
    }).join('');

    watchlist.forEach(id => {
        const btn = document.querySelector(`.btn-watchlist[data-id="${id}"]`);
        if (btn) {
            btn.textContent = 'Remove';
            btn.classList.add('btn-watchlist--added');
        }
    });
}

function buildParams() {
    const params = new URLSearchParams();
    const title   = document.getElementById('filter-title').value.trim();
    const genre   = document.getElementById('filter-genre').value;
    const yearFrom = document.getElementById('filter-year-from').value;
    const yearTo  = document.getElementById('filter-year-to').value;
    const country = document.getElementById('filter-country').value;
    const sortBy  = document.getElementById('filter-sort').value;

    if (title)   params.set('title', title);
    if (genre)   params.set('genre', genre);
    if (yearFrom) params.set('year_from', yearFrom);
    if (yearTo)  params.set('year_to', yearTo);
    if (country) params.set('country', country);
    if (sortBy !== 'id') params.set('sort_by', sortBy);
    if (sortDir === 'desc') params.set('sort_dir', 'desc');

    return params;
}

async function fetchMovies() {
    const params = buildParams();
    try {
        const res  = await fetch(`${PHP_API}/api/movies.php?${params}`);
        const data = await res.json();
        allMovies  = data.movies;
        renderMovies(allMovies);
    } catch (_) {
        document.querySelector('table tbody').innerHTML =
            '<tr><td colspan="10" style="text-align:center;color:#e05252;padding:30px;">Could not load movies. Is the PHP server running?</td></tr>';
    }
}

let debounceTimer;
function onFilterChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchMovies, 250);
}
function onImmediateFilterChange() { fetchMovies(); }

// ── Auth ──────────────────────────────────────────────────────────────────────

async function checkAuth() {
    try {
        const res  = await fetch(`${PHP_API}/api/check_auth.php`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            document.getElementById('nav-login').style.display    = 'none';
            document.getElementById('nav-dashboard').style.display = '';
            document.getElementById('nav-library').style.display   = '';
        }
    } catch (_) {}
}

// ── Watchlist — DB + localStorage ────────────────────────────────────────────

const watchlist = new Set();

async function loadWatchlistFromDb() {
    if (currentUser) {
        try {
            const res  = await fetch(`${PHP_API}/api/watchlist.php`, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            data.movies.forEach(m => watchlist.add(String(m.id)));

            // Merge any items saved locally while the user was a guest.
            const localIds = getLocalIds();
            const toMerge  = [...localIds].filter(id => !watchlist.has(id));
            for (const id of toMerge) {
                watchlist.add(id);
                await addToWatchlistDb(id);
            }
            if (localIds.size > 0) localStorage.removeItem(STORAGE_KEY);
        } catch (_) {}
    } else {
        // Guest: load from localStorage.
        getLocalIds().forEach(id => watchlist.add(id));
    }
}

async function addToWatchlistDb(movieId) {
    if (!currentUser) {
        persistLocalIds();
        return null;
    }
    const res = await fetch(`${PHP_API}/api/watchlist.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: parseInt(movieId) }),
    });
    return res.json();
}

async function removeFromWatchlistDb(movieId) {
    if (!currentUser) {
        persistLocalIds();
        return;
    }
    await fetch(`${PHP_API}/api/watchlist.php`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: parseInt(movieId) }),
    });
}

function renderWatchlistSidebar() {
    const container = document.getElementById('watchlist-items');
    const empty     = document.getElementById('watchlist-empty');
    const count     = document.getElementById('watchlist-count');
    const guestNote = document.getElementById('watchlist-guest-note');

    count.textContent = watchlist.size ? `(${watchlist.size})` : '';

    if (guestNote) guestNote.style.display = (!currentUser && watchlist.size > 0) ? 'block' : 'none';

    if (watchlist.size === 0) {
        container.innerHTML = '';
        empty.hidden = false;
        return;
    }
    empty.hidden = true;
    container.innerHTML = Array.from(watchlist).map(id => {
        const movie = allMovies.find(m => m.id == id);
        if (!movie) return '';
        const img = imgIndex(movie.id);
        return `<li class="watchlist-item">
            <img src="images/movie_${img}.png" alt="${movie.title}">
            <div class="watchlist-item-info">
                <span class="watchlist-item-title">${movie.title}</span>
                <span class="watchlist-item-meta">${movie.release_year} · ${movie.rating}</span>
            </div>
            <button class="btn-watched" data-remove="${movie.id}" title="Mark as watched">&#x2713;</button>
        </li>`;
    }).join('');
}

async function doAddToWatchlist(id, btn) {
    watchlist.add(id);
    btn.textContent = 'Remove';
    btn.classList.add('btn-watchlist--added');
    renderWatchlistSidebar();

    const movie = allMovies.find(m => String(m.id) === id);

    if (currentUser) {
        const data = await addToWatchlistDb(id);
        if (data?.low_rating_warning) showLowRatingBanner(data.title, data.score);
    } else {
        persistLocalIds();
        if (movie && parseFloat(movie.score) < LOW_RATING_THRESHOLD) {
            showLowRatingBanner(movie.title, movie.score);
        }
    }
}

document.addEventListener('click', async e => {
    if (e.target.classList.contains('btn-watchlist')) {
        const id  = e.target.getAttribute('data-id');
        const btn = e.target;

        if (watchlist.has(id)) {
            watchlist.delete(id);
            btn.textContent = '+ Watch';
            btn.classList.remove('btn-watchlist--added');
            await removeFromWatchlistDb(id);
            renderWatchlistSidebar();
            return;
        }

        const movie = allMovies.find(m => String(m.id) === id);
        if (movie && parseFloat(movie.score) < LOW_RATING_THRESHOLD) {
            showLowRatingModal(movie, () => doAddToWatchlist(id, btn));
        } else {
            await doAddToWatchlist(id, btn);
        }
    }

    if (e.target.classList.contains('btn-watched')) {
        const id = e.target.getAttribute('data-remove');
        watchlist.delete(id);
        const tableBtn = document.querySelector(`.btn-watchlist[data-id="${id}"]`);
        if (tableBtn) {
            tableBtn.textContent = '+ Watch';
            tableBtn.classList.remove('btn-watchlist--added');
        }
        await removeFromWatchlistDb(id);
        renderWatchlistSidebar();
    }
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function init() {
    await checkAuth();
    await loadWatchlistFromDb();

    try {
        const res = await fetch(`${PHP_API}/api/movies.php?meta=1`);
        const { genres, countries } = await res.json();

        const genreSelect = document.getElementById('filter-genre');
        genres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = g;
            genreSelect.appendChild(opt);
        });

        const countrySelect = document.getElementById('filter-country');
        countries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = c;
            countrySelect.appendChild(opt);
        });
    } catch (_) {}

    await fetchMovies();

    document.getElementById('filter-title').addEventListener('input', onFilterChange);
    document.getElementById('filter-genre').addEventListener('change', onImmediateFilterChange);
    document.getElementById('filter-year-from').addEventListener('input', onFilterChange);
    document.getElementById('filter-year-to').addEventListener('input', onFilterChange);
    document.getElementById('filter-country').addEventListener('change', onImmediateFilterChange);
    document.getElementById('filter-sort').addEventListener('change', onImmediateFilterChange);

    document.getElementById('btn-sort-dir').addEventListener('click', () => {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        document.getElementById('btn-sort-dir').textContent = sortDir === 'asc' ? '↑' : '↓';
        fetchMovies();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        document.getElementById('filter-title').value    = '';
        document.getElementById('filter-genre').value   = '';
        document.getElementById('filter-year-from').value = '';
        document.getElementById('filter-year-to').value = '';
        document.getElementById('filter-country').value = '';
        document.getElementById('filter-sort').value    = 'id';
        sortDir = 'asc';
        document.getElementById('btn-sort-dir').textContent = '↑';
        fetchMovies();
    });
}

init();
