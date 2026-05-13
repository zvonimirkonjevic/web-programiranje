<?php

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

startSecureSession();

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthenticated.']);
    exit;
}

$userId = (int) getSessionUser()['id'];
$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getDbConnection();

// ── GET — return full movie objects for this user's watchlist ────────────────
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT m.id, m.title, m.director, m.release_year, m.duration_min, m.rating, m.genre, m.country, m.description
         FROM watchlists w
         JOIN movies m ON m.id = w.movie_id
         WHERE w.user_id = ?
         ORDER BY w.created_at ASC'
    );
    $stmt->execute([$userId]);
    $movies = $stmt->fetchAll();
    echo json_encode(['movies' => $movies]);
    exit;
}

$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$movieId = (int) ($body['movie_id'] ?? 0);

if ($movieId <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid movie ID.']);
    exit;
}

// ── POST — add movie to watchlist ────────────────────────────────────────────
if ($method === 'POST') {
    $check = $pdo->prepare('SELECT id FROM movies WHERE id = ?');
    $check->execute([$movieId]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Movie not found.']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT IGNORE INTO watchlists (user_id, movie_id) VALUES (?, ?)');
    $stmt->execute([$userId, $movieId]);

    http_response_code(201);
    echo json_encode(['message' => 'Added to watchlist.']);
    exit;
}

// ── DELETE — remove movie from watchlist ─────────────────────────────────────
if ($method === 'DELETE') {
    $stmt = $pdo->prepare('DELETE FROM watchlists WHERE user_id = ? AND movie_id = ?');
    $stmt->execute([$userId, $movieId]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Entry not found.']);
        exit;
    }

    echo json_encode(['message' => 'Removed from watchlist.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
