<?php

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

startSecureSession();

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET /api/users.php — list all users
if ($method === 'GET') {
    echo json_encode(['users' => getAllUsers()]);
    exit;
}

$body   = json_decode(file_get_contents('php://input'), true);
$userId = (int) ($body['id'] ?? 0);

if ($userId <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid user ID.']);
    exit;
}

// PATCH /api/users.php — update role
if ($method === 'PATCH') {
    $role = $body['role'] ?? '';
    if (!updateUserRole($userId, $role)) {
        http_response_code(422);
        echo json_encode(['error' => 'Invalid role or user not found.']);
        exit;
    }
    echo json_encode(['message' => 'Role updated.']);
    exit;
}

// DELETE /api/users.php — delete user (admin cannot delete themselves)
if ($method === 'DELETE') {
    $currentUser = getSessionUser();
    if ($userId === $currentUser['id']) {
        http_response_code(422);
        echo json_encode(['error' => 'You cannot delete your own account.']);
        exit;
    }
    if (!deleteUser($userId)) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
        exit;
    }
    echo json_encode(['message' => 'User deleted.']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
