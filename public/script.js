const PHP_API = 'http://localhost:8080';
const IMAGE_COUNT = 17;

let allMovies = [];

function imgIndex(movieId) {
    return ((movieId - 1) % IMAGE_COUNT) + 1;
}

function renderMovies(movies) {
    const tbody = document.querySelector('table tbody');
    if (movies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-gray);padding:30px;">No movies match your filters.</td></tr>';
        return;
    }
    tbody.innerHTML = movies.map((movie, index) => {
        const rank = index + 1;
        const img  = imgIndex(movie.id);
        return `<tr>
            <td data-label="Poster"><img src="images/movie_${img}.png" alt="${movie.title}"></td>
            <td data-label="Rank">${rank}</td>
            <td data-label="Title">${movie.title}</td>
            <td data-label="Year">${movie.release_year}</td>
            <td data-label="Duration">${movie.duration_min}</td>
            <td data-label="Rating">${movie.rating}</td>
            <td data-label="Genre">${movie.genre}</td>
            <td data-label="Watchlist">
                <button class="btn-watchlist" data-img="${img}" data-id="${movie.id}">+ Watch</button>
            </td>
        </tr>`;
    }).join('');
}

const ratingMap = {
    kids: new Set(['G', 'PG', 'TV-Y', 'TV-G', 'TV-Y7', 'TV-Y7-FV']),
    teen: new Set(['PG-13', 'TV-PG', 'TV-14']),
    adult: new Set(['R', 'TV-MA', 'NC-17', 'NR', 'UR'])
};

function applyFilters() {
    const text = document.getElementById('filter-text').value.toLowerCase();
    const minYear = parseInt(document.getElementById('filter-year').value, 10);
    const ratingGroup = document.querySelector('input[name="filter-rating"]:checked').value;

    const filtered = allMovies.filter(movie => {
        if (!movie.title.toLowerCase().includes(text)) return false;
        if (movie.release_year < minYear) return false;
        if (ratingGroup !== 'all' && !ratingMap[ratingGroup].has(movie.rating)) return false;
        return true;
    });

    renderMovies(filtered);
}

const watchlist = new Set();

function addMoviesToWatchlist() {
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

document.addEventListener('click', e => {
    if (e.target.classList.contains('btn-watchlist')) {
        const id = e.target.getAttribute('data-id');
        if (watchlist.has(id)) {
            watchlist.delete(id);
            e.target.textContent = '+ Watch';
            e.target.classList.remove('btn-watchlist--added');
        } else {
            watchlist.add(id);
            e.target.textContent = 'Remove';
            e.target.classList.add('btn-watchlist--added');
        }
        addMoviesToWatchlist();
    }

    if (e.target.classList.contains('btn-watched')) {
        const id = e.target.getAttribute('data-remove');
        watchlist.delete(id);
        const tableBtn = document.querySelector(`.btn-watchlist[data-id="${id}"]`);
        if (tableBtn) {
            tableBtn.textContent = '+ Watch';
            tableBtn.classList.remove('btn-watchlist--added');
        }
        addMoviesToWatchlist();
    }
});

fetch(`${PHP_API}/api/movies.php`)
    .then(res => res.json())
    .then(data => {
        allMovies = data.movies;

        const years = allMovies.map(m => m.release_year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        const slider = document.getElementById('filter-year');
        slider.min = minYear;
        slider.max = maxYear;
        slider.value = minYear;
        document.getElementById('year-value').textContent = minYear;

        slider.addEventListener('input', () => {
            document.getElementById('year-value').textContent = slider.value;
            applyFilters();
        });
        document.getElementById('filter-text').addEventListener('input', applyFilters);
        document.querySelectorAll('input[name="filter-rating"]').forEach(r => r.addEventListener('change', applyFilters));

        renderMovies(allMovies);
    })
    .catch(() => {
        document.querySelector('table tbody').innerHTML =
            '<tr><td colspan="8" style="text-align:center;color:#e05252;padding:30px;">Could not load movies. Is the PHP server running?</td></tr>';
    });
