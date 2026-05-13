const PHP_API = 'http://localhost:8080';
const IMAGE_COUNT = 17;

let allMovies = [];
let sortDir = 'asc';
let currentUser = null;

function imgIndex(movieId) {
    return ((movieId - 1) % IMAGE_COUNT) + 1;
}

function renderMovies(movies) {
    const tbody = document.querySelector('table tbody');
    document.getElementById('results-info').textContent =
        movies.length === 0 ? '' : `Showing ${movies.length} result${movies.length === 1 ? '' : 's'}`;

    if (movies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-gray);padding:30px;">No movies match your filters.</td></tr>';
        return;
    }
    tbody.innerHTML = movies.map((movie, index) => {
        const img = imgIndex(movie.id);
        return `<tr>
            <td data-label="Poster"><img src="images/movie_${img}.png" alt="${movie.title}"></td>
            <td data-label="Rank">${index + 1}</td>
            <td data-label="Title">${movie.title}</td>
            <td data-label="Year">${movie.release_year}</td>
            <td data-label="Duration">${movie.duration_min}</td>
            <td data-label="Rating">${movie.rating}</td>
            <td data-label="Genre">${movie.genre}</td>
            <td data-label="Country">${movie.country || '—'}</td>
            <td data-label="Watchlist">
                <button class="btn-watchlist" data-img="${img}" data-id="${movie.id}">+ Watch</button>
            </td>
        </tr>`;
    }).join('');

    // Restore watchlist button state for visible movies.
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
    const title = document.getElementById('filter-title').value.trim();
    const genre = document.getElementById('filter-genre').value;
    const yearFrom = document.getElementById('filter-year-from').value;
    const yearTo = document.getElementById('filter-year-to').value;
    const country = document.getElementById('filter-country').value;
    const sortBy = document.getElementById('filter-sort').value;

    if (title) params.set('title', title);
    if (genre) params.set('genre', genre);
    if (yearFrom) params.set('year_from', yearFrom);
    if (yearTo) params.set('year_to', yearTo);
    if (country) params.set('country', country);
    if (sortBy !== 'id') params.set('sort_by', sortBy);
    if (sortDir === 'desc') params.set('sort_dir', 'desc');

    return params;
}

async function fetchMovies() {
    const params = buildParams();
    try {
        const res = await fetch(`${PHP_API}/api/movies.php?${params}`);
        const data = await res.json();
        allMovies = data.movies;
        renderMovies(allMovies);
    } catch (_) {
        document.querySelector('table tbody').innerHTML =
            '<tr><td colspan="9" style="text-align:center;color:#e05252;padding:30px;">Could not load movies. Is the PHP server running?</td></tr>';
    }
}

// Debounce for title text input.
let debounceTimer;
function onFilterChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchMovies, 250);
}

function onImmediateFilterChange() {
    fetchMovies();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function checkAuth() {
    try {
        const res = await fetch(`${PHP_API}/api/check_auth.php`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            document.getElementById('nav-login').style.display = 'none';
            document.getElementById('nav-dashboard').style.display = '';
            document.getElementById('nav-library').style.display = '';
        }
    } catch (_) {}
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

const watchlist = new Set();

async function loadWatchlistFromDb() {
    try {
        const res = await fetch(`${PHP_API}/api/watchlist.php`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        data.movies.forEach(m => watchlist.add(String(m.id)));
    } catch (_) {}
}

async function addToWatchlistDb(movieId) {
    await fetch(`${PHP_API}/api/watchlist.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: parseInt(movieId) }),
    });
}

async function removeFromWatchlistDb(movieId) {
    await fetch(`${PHP_API}/api/watchlist.php`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: parseInt(movieId) }),
    });
}

function renderWatchlistSidebar() {
    const container = document.getElementById('watchlist-items');
    const empty = document.getElementById('watchlist-empty');
    const count = document.getElementById('watchlist-count');

    count.textContent = watchlist.size ? `(${watchlist.size})` : '';

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
            <button class="btn-watched" data-remove="${movie.id}" title="Mark as watched">✓</button>
        </li>`;
    }).join('');
}

document.addEventListener('click', async e => {
    if (e.target.classList.contains('btn-watchlist')) {
        const id = e.target.getAttribute('data-id');

        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        if (watchlist.has(id)) {
            watchlist.delete(id);
            e.target.textContent = '+ Watch';
            e.target.classList.remove('btn-watchlist--added');
            await removeFromWatchlistDb(id);
        } else {
            watchlist.add(id);
            e.target.textContent = 'Remove';
            e.target.classList.add('btn-watchlist--added');
            await addToWatchlistDb(id);
        }
        renderWatchlistSidebar();
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

    if (currentUser) {
        await loadWatchlistFromDb();
    }

    // Populate genre and country dropdowns from server.
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

    // Wire up filters.
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
        document.getElementById('filter-title').value = '';
        document.getElementById('filter-genre').value = '';
        document.getElementById('filter-year-from').value = '';
        document.getElementById('filter-year-to').value = '';
        document.getElementById('filter-country').value = '';
        document.getElementById('filter-sort').value = 'id';
        sortDir = 'asc';
        document.getElementById('btn-sort-dir').textContent = '↑';
        fetchMovies();
    });
}

init();
