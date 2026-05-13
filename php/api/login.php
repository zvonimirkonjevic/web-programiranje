<?php

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

startSecureSession();

$body = json_decode(file_get_contents('php://input'), true);

$identifier = trim($body['identifier'] ?? '');
$password = $body['password'] ?? '';

if ($identifier === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['error' => 'Username/email and password are required.']);
    exit;
}

$result = loginUser($identifier, $password);

if (!$result['success']) {
    http_response_code(401);
    echo json_encode(['error' => $result['error']]);
    exit;
}

setUserSession($result['user']);

echo json_encode(['user' => $result['user']]);
