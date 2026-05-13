CREATE DATABASE IF NOT EXISTS imdb_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE imdb_app;

CREATE TABLE IF NOT EXISTS users (
    id           INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)     NOT NULL UNIQUE,
    email        VARCHAR(255)    NOT NULL UNIQUE,
    password_hash VARCHAR(255)   NOT NULL,
    role         ENUM('user','admin') NOT NULL DEFAULT 'user',
    created_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed a default admin account.
-- Password is: Admin@1234
-- Generated with: password_hash('Admin@1234', PASSWORD_BCRYPT, ['cost' => 12])
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES (
    'admin',
    'admin@example.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
);
