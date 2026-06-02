<?php

require_once __DIR__ . '/../config/database.php';

function registerUser(string $username, string $email, string $password): array
{
    $username = trim($username);
    $email = trim($email);

    if (strlen($username) < 3 || strlen($username) > 50) {
        return ['success' => false, 'error' => 'Username must be between 3 and 50 characters.'];
    }
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        return ['success' => false, 'error' => 'Username may only contain letters, numbers, and underscores.'];
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => 'Invalid email address.'];
    }
    if (strlen($password) < 8) {
        return ['success' => false, 'error' => 'Password must be at least 8 characters.'];
    }

    $pdo = getDbConnection();

    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        return ['success' => false, 'error' => 'Username or email is already taken.'];
    }

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    $stmt = $pdo->prepare(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    );
    $stmt->execute([$username, $email, $hash]);

    return ['success' => true, 'user_id' => (int) $pdo->lastInsertId()];
}

function loginUser(string $identifier, string $password): array
{
    $identifier = trim($identifier);
    $pdo = getDbConnection();

    $stmt = $pdo->prepare(
        'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1'
    );
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'error' => 'Invalid username/email or password.'];
    }

    // Upgrade hash if the cost factor has changed.
    if (password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
        $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([$newHash, $user['id']]);
    }

    return [
        'success' => true,
        'user' => [
            'id' => (int) $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
        ],
    ];
}

