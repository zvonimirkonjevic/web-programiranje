<?php

function startSecureSession(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    session_start();
}

function setUserSession(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
}

function getSessionUser(): ?array
{
    return $_SESSION['user'] ?? null;
}

function isLoggedIn(): bool
{
    return !empty($_SESSION['user']);
}

function isAdmin(): bool
{
    return !empty($_SESSION['user']) && $_SESSION['user']['role'] === 'admin';
}

function destroySession(): void
{
    session_unset();
    session_destroy();
    setcookie(session_name(), '', time() - 3600, '/');
}

