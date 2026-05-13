<?php

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

startSecureSession();

$method = $_SERVER['REQUEST_METHOD'];

// ── GET — public, no auth required ──────────────────────────────────────────
if ($method === 'GET') {
    $pdo = getDbConnection();

    // ?meta=1 returns distinct genres and countries for populating dropdowns.
    if (!empty($_GET['meta'])) {
        $genreRows = $pdo->query('SELECT genre FROM movies WHERE genre != ""')->fetchAll(PDO::FETCH_COLUMN);
        $genres = [];
        foreach ($genreRows as $g) {
            foreach (array_map('trim', explode(',', $g)) as $item) {
                if ($item !== '') $genres[$item] = true;
            }
        }
        ksort($genres);

        $countryRows = $pdo->query('SELECT country FROM movies WHERE country != ""')->fetchAll(PDO::FETCH_COLUMN);
        $countries = [];
        foreach ($countryRows as $c) {
            foreach (array_map('trim', explode(',', $c)) as $item) {
                if ($item !== '') $countries[$item] = true;
            }
        }
        ksort($countries);

        echo json_encode(['genres' => array_keys($genres), 'countries' => array_keys($countries)]);
        exit;
    }

    // Build WHERE clauses from query params.
    $where  = [];
    $params = [];

    if (!empty($_GET['title'])) {
        $where[]  = 'title LIKE ?';
        $params[] = '%' . $_GET['title'] . '%';
    }
    if (!empty($_GET['genre'])) {
        $where[]  = 'genre LIKE ?';
        $params[] = '%' . $_GET['genre'] . '%';
    }
    if (isset($_GET['year_from']) && $_GET['year_from'] !== '') {
        $where[]  = 'release_year >= ?';
        $params[] = (int) $_GET['year_from'];
    }
    if (isset($_GET['year_to']) && $_GET['year_to'] !== '') {
        $where[]  = 'release_year <= ?';
        $params[] = (int) $_GET['year_to'];
    }
    if (!empty($_GET['country'])) {
        $where[]  = 'country LIKE ?';
        $params[] = '%' . $_GET['country'] . '%';
    }

    $allowedSort = ['id', 'title', 'release_year', 'duration_min', 'rating'];
    $sortBy  = in_array($_GET['sort_by'] ?? '', $allowedSort, true) ? $_GET['sort_by'] : 'id';
    $sortDir = ($_GET['sort_dir'] ?? 'asc') === 'desc' ? 'DESC' : 'ASC';

    $sql = 'SELECT id, title, director, release_year, duration_min, rating, genre, country, description FROM movies';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= " ORDER BY {$sortBy} {$sortDir}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $movies = $stmt->fetchAll();

    echo json_encode(['movies' => $movies, 'total' => count($movies)]);
    exit;
}

// ── All mutating methods require admin ───────────────────────────────────────
if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── POST — create ────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $errors = validateMovie($body);
    if ($errors) {
        http_response_code(422);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    $pdo  = getDbConnection();
    $stmt = $pdo->prepare(
        'INSERT INTO movies (title, director, release_year, duration_min, rating, genre, country, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        trim($body['title']),
        trim($body['director'] ?? ''),
        (int) $body['release_year'],
        (int) $body['duration_min'],
        $body['rating'],
        trim($body['genre']),
        trim($body['country'] ?? ''),
        trim($body['description'] ?? ''),
    ]);

    $id   = (int) $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM movies WHERE id = ?');
    $stmt->execute([$id]);

    http_response_code(201);
    echo json_encode(['movie' => $stmt->fetch()]);
    exit;
}

// ── PATCH — update ───────────────────────────────────────────────────────────
if ($method === 'PATCH') {
    $id = (int) ($body['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(422);
        echo json_encode(['error' => 'Invalid movie ID.']);
        exit;
    }

    $errors = validateMovie($body);
    if ($errors) {
        http_response_code(422);
        echo json_encode(['errors' => $errors]);
        exit;
    }

    $pdo  = getDbConnection();
    $stmt = $pdo->prepare(
        'UPDATE movies
         SET title = ?, director = ?, release_year = ?, duration_min = ?, rating = ?, genre = ?, country = ?, description = ?
         WHERE id = ?'
    );
    $stmt->execute([
        trim($body['title']),
        trim($body['director'] ?? ''),
        (int) $body['release_year'],
        (int) $body['duration_min'],
        $body['rating'],
        trim($body['genre']),
        trim($body['country'] ?? ''),
        trim($body['description'] ?? ''),
        $id,
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Movie not found.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT * FROM movies WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['movie' => $stmt->fetch()]);
    exit;
}

// ── DELETE ───────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int) ($body['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(422);
        echo json_encode(['error' => 'Invalid movie ID.']);
        exit;
    }

    $pdo  = getDbConnection();
    $stmt = $pdo->prepare('DELETE FROM movies WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Movie not found.']);
        exit;
    }

    echo json_encode(['message' => 'Movie deleted.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);

// ── Validation ───────────────────────────────────────────────────────────────
function validateMovie(array $data): array
{
    $errors = [];
    $currentYear = (int) date('Y');

    $validRatings = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-Y7-FV', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'NR', 'UR'];

    $title = trim($data['title'] ?? '');
    if ($title === '') {
        $errors['title'] = 'Title is required.';
    } elseif (strlen($title) > 255) {
        $errors['title'] = 'Title must be 255 characters or fewer.';
    }

    $director = trim($data['director'] ?? '');
    if (strlen($director) > 255) {
        $errors['director'] = 'Director must be 255 characters or fewer.';
    }

    $year = $data['release_year'] ?? '';
    if ($year === '' || !ctype_digit((string) $year)) {
        $errors['release_year'] = 'Release year must be a number.';
    } elseif ((int) $year < 1888 || (int) $year > $currentYear + 5) {
        $errors['release_year'] = "Release year must be between 1888 and " . ($currentYear + 5) . ".";
    }

    $duration = $data['duration_min'] ?? '';
    if ($duration === '' || !ctype_digit((string) $duration)) {
        $errors['duration_min'] = 'Duration must be a number.';
    } elseif ((int) $duration < 1 || (int) $duration > 600) {
        $errors['duration_min'] = 'Duration must be between 1 and 600 minutes.';
    }

    $rating = $data['rating'] ?? '';
    if (!in_array($rating, $validRatings, true)) {
        $errors['rating'] = 'Invalid rating value.';
    }

    $genre = trim($data['genre'] ?? '');
    if ($genre === '') {
        $errors['genre'] = 'Genre is required.';
    } elseif (strlen($genre) > 255) {
        $errors['genre'] = 'Genre must be 255 characters or fewer.';
    }

    $country = trim($data['country'] ?? '');
    if (strlen($country) > 255) {
        $errors['country'] = 'Country must be 255 characters or fewer.';
    }

    $description = trim($data['description'] ?? '');
    if (strlen($description) > 2000) {
        $errors['description'] = 'Description must be 2000 characters or fewer.';
    }

    return $errors;
}
