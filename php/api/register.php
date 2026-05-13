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

$username = trim($body['username'] ?? '');
$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$confirm = $body['confirm_password'] ?? '';

if ($password !== $confirm) {
    http_response_code(422);
    echo json_encode(['error' => 'Passwords do not match.']);
    exit;
}

$result = registerUser($username, $email, $password);

if (!$result['success']) {
    http_response_code(422);
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code(201);
echo json_encode(['message' => 'Account created successfully.', 'user_id' => $result['user_id']]);
