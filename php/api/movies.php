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

    $sql = 'SELECT id, title, director, release_year, duration_min, rating, genre, country, description, score FROM movies';
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

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
