let allMovies = [];

function parseYear(str) {
    return parseInt(str, 10);
}

function renderMovies(movies) {
    const tbody = document.querySelector('table tbody');
    if (movies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-gray);padding:30px;">No movies match your filters.</td></tr>';
        return;
    }
    tbody.innerHTML = movies.map((movie, index) => {
        const rank = index + 1;
        const title = movie.title.replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const year = parseYear(movie.release_year);
        const duration = parseInt(movie.duration) || 'N/A';
        return `<tr>
            <td data-label="Poster"><img src="images/movie_${movie._imgIndex}.png" alt="${title}"></td>
            <td data-label="Rank">${rank}</td>
            <td data-label="Title">${title}</td>
            <td data-label="Year">${year}</td>
            <td data-label="Duration">${duration}</td>
            <td data-label="Rating">${movie.rating}</td>
            <td data-label="Genre">${movie.listed_in}</td>
            <td data-label="Watchlist">
                <button class="btn-watchlist" data-img="${movie._imgIndex}">+ Watch</button>
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
        if (parseYear(movie.release_year) < minYear) return false;
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
    container.innerHTML = Array.from(watchlist).map(imgIndex => {
        const movie = allMovies.find(m => m._imgIndex == imgIndex);
        return `<li class="watchlist-item">
            <img src="images/movie_${movie._imgIndex}.png" alt="${movie.title}">
            <div class="watchlist-item-info">
                <span class="watchlist-item-title">${movie.title}</span>
                <span class="watchlist-item-meta">${movie.release_year} · ${movie.rating}</span>
            </div>
            <button class="btn-watched" data-remove="${movie._imgIndex}" title="Mark as watched">✓</button>
        </li>`;
    }).join('');
}

document.addEventListener('click', e => {
    if (e.target.classList.contains('btn-watchlist')) {
        const imgIndex = e.target.getAttribute('data-img');
        if (watchlist.has(imgIndex)) {
            watchlist.delete(imgIndex);
            e.target.textContent = '+ Watch';
            e.target.classList.remove('btn-watchlist--added');
        } else {
            watchlist.add(imgIndex);
            e.target.textContent = 'Remove';
            e.target.classList.add('btn-watchlist--added');
        }
        addMoviesToWatchlist();
    }

    if (e.target.classList.contains('btn-watched')) {
        const imgIndex = e.target.getAttribute('data-remove');
        watchlist.delete(imgIndex);
        const tableBtn = document.querySelector(`.btn-watchlist[data-img="${imgIndex}"]`);
        if (tableBtn) {
            tableBtn.textContent = '+ Watch';
            tableBtn.classList.remove('btn-watchlist--added');
        }
        addMoviesToWatchlist();
    }
});

fetch('/data/netflix_titles.csv')
    .then(res => res.text())
    .then(csv => {
        const result = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true
        });

        allMovies = result.data
            .filter(row => row.type === 'Movie')
            .slice(0, 17)
            .map((movie, index) => ({ ...movie, _imgIndex: index + 1 }));

        const years = allMovies.map(m => parseYear(m.release_year)).filter(y => !isNaN(y));
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
        addMoviesToWatchlist();
    });
