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
    $pdo  = getDbConnection();
    $stmt = $pdo->query(
        'SELECT id, title, director, release_year, duration_min, rating, genre, description
         FROM movies ORDER BY id ASC'
    );
    echo json_encode(['movies' => $stmt->fetchAll()]);
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
        'INSERT INTO movies (title, director, release_year, duration_min, rating, genre, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        trim($body['title']),
        trim($body['director'] ?? ''),
        (int) $body['release_year'],
        (int) $body['duration_min'],
        $body['rating'],
        trim($body['genre']),
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
         SET title = ?, director = ?, release_year = ?, duration_min = ?, rating = ?, genre = ?, description = ?
         WHERE id = ?'
    );
    $stmt->execute([
        trim($body['title']),
        trim($body['director'] ?? ''),
        (int) $body['release_year'],
        (int) $body['duration_min'],
        $body['rating'],
        trim($body['genre']),
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

    $description = trim($data['description'] ?? '');
    if (strlen($description) > 2000) {
        $errors['description'] = 'Description must be 2000 characters or fewer.';
    }

    return $errors;
}
