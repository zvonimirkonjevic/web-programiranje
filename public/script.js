fetch('/data/netflix_titles.csv')
    .then(res => res.text())
    .then(csv => {
        const result = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true
        });

        const movies = result.data
            .filter(row => row.type === 'Movie')
            .slice(0, 17);

        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = movies.map((movie, index) => {
            const rank = index + 1;
            const title = movie.title.replace(/"/g, '&quot;').replace(/</g, '&lt;');
            return `<tr>
                <td data-label="Poster"><img src="images/movie_${rank}.png" alt="${title}"></td>
                <td data-label="Rank">${rank}</td>
                <td data-label="Title">${title}</td>
                <td data-label="Year">${new Date(movie.release_year).getFullYear()}</td>
                <td data-label="Duration">${new Number(movie.duration.replace(" min", "")) || 'N/A'}</td>
                <td data-label="Rating">${movie.rating}</td>
                <td data-label="Genre">${movie.listed_in}</td>
            </tr>`;
        }).join('');
    });
