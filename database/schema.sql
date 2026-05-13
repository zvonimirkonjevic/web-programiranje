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

CREATE TABLE IF NOT EXISTS movies (
    id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255)  NOT NULL,
    director     VARCHAR(255)  NOT NULL DEFAULT '',
    release_year SMALLINT      NOT NULL,
    duration_min SMALLINT      NOT NULL,
    rating       VARCHAR(20)   NOT NULL,
    genre        VARCHAR(255)  NOT NULL,
    country      VARCHAR(255)  NOT NULL DEFAULT '',
    description  TEXT          NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO movies (id, title, director, release_year, duration_min, rating, genre, country, description) VALUES
(1, 'Dick Johnson Is Dead', 'Kirsten Johnson', 2020, 90, 'PG-13', 'Documentaries', 'United States', 'As her father nears the end of his life, filmmaker Kirsten Johnson stages his death in inventive and comical ways to help them both face the inevitable.'),
(2, 'My Little Pony: A New Generation', 'Robert Cullen, José Luis Ucha', 2021, 91, 'PG', 'Children & Family Movies', '', 'Equestria''s divided. But a bright-eyed hero believes Earth Ponies, Pegasi and Unicorns should be pals — and, hoof to heart, she''s determined to prove it.'),
(3, 'Sankofa', 'Haile Gerima', 1993, 125, 'TV-MA', 'Dramas, Independent Movies, International Movies', 'United States, Ghana, Burkina Faso, United Kingdom, Germany, Ethiopia', 'On a photo shoot in Ghana, an American model slips back in time, becomes enslaved on a plantation and bears witness to the agony of her ancestral past.'),
(4, 'The Starling', 'Theodore Melfi', 2021, 104, 'PG-13', 'Comedies, Dramas', 'United States', 'A woman adjusting to life after a loss contends with a feisty bird that''s taken over her garden — and a husband who''s struggling to find a way forward.'),
(5, 'Je Suis Karl', 'Christian Schwochow', 2021, 127, 'TV-MA', 'Dramas, International Movies', 'Germany, Czech Republic', 'After most of her family is murdered in a terrorist bombing, a young woman is unknowingly lured into joining the very group that killed them.'),
(6, 'Confessions of an Invisible Girl', 'Bruno Garotti', 2021, 91, 'TV-PG', 'Children & Family Movies, Comedies', '', 'When the clever but socially-awkward Tetê joins a new school, she''ll do anything to fit in. But the queen bee among her classmates has other ideas.'),
(7, 'Europe''s Most Dangerous Man: Otto Skorzeny in Spain', 'Pedro de Echave García, Pablo Azorín Williams', 2020, 67, 'TV-MA', 'Documentaries, International Movies', '', 'Declassified documents reveal the post-WWII life of Otto Skorzeny, a close Hitler ally who escaped to Spain and became an adviser to world presidents.'),
(8, 'Intrusion', 'Adam Salky', 2021, 94, 'TV-14', 'Thrillers', '', 'After a deadly home invasion at a couple''s new dream house, the traumatized wife searches for answers — and learns the real danger is just beginning.'),
(9, 'Avvai Shanmughi', 'K.S. Ravikumar', 1996, 161, 'TV-PG', 'Comedies, International Movies', '', 'Newly divorced and denied visitation rights with his daughter, a doting father disguises himself as a gray-haired nanny in order to spend time with her.'),
(10, 'Go! Go! Cory Carson: Chrissy Takes the Wheel', 'Alex Woo, Stanley Moore', 2021, 61, 'TV-Y', 'Children & Family Movies', '', 'From arcade games to sled days and hiccup cures, Cory Carson''s curious little sister Chrissy speeds off on her own for fun and adventure all over town!'),
(11, 'Jeans', 'S. Shankar', 1998, 166, 'TV-14', 'Comedies, International Movies, Romantic Movies', 'India', 'When the father of the man she loves insists that his twin sons marry twin sisters, a woman creates an alter ego that might be a bit too convincing.'),
(12, 'Minsara Kanavu', 'Rajiv Menon', 1997, 147, 'TV-PG', 'Comedies, International Movies, Music & Musicals', '', 'A tangled love triangle ensues when a man falls for a woman studying to become a nun — and she falls for the friend he enlists to help him pursue her.'),
(13, 'Grown Ups', 'Dennis Dugan', 2010, 103, 'PG-13', 'Comedies', 'United States', 'Mourning the loss of their beloved junior high basketball coach, five middle-aged pals reunite at a lake house and rediscover the joys of being a kid.'),
(14, 'Dark Skies', 'Scott Stewart', 2013, 97, 'PG-13', 'Horror Movies, Sci-Fi & Fantasy', 'United States', 'A family''s idyllic suburban life shatters when an alien force invades their home, and as they struggle to convince others of the deadly threat.'),
(15, 'Paranoia', 'Robert Luketic', 2013, 106, 'PG-13', 'Thrillers', 'United States, India, France', 'Blackmailed by his company''s CEO, a low-level employee finds himself forced to spy on the boss''s rival and former mentor.'),
(16, 'Ankahi Kahaniya', 'Ashwiny Iyer Tiwari, Abhishek Chaubey, Saket Chaudhary', 2021, 111, 'TV-14', 'Dramas, Independent Movies, International Movies', '', 'As big city life buzzes around them, lonely souls discover surprising sources of connection and companionship in three tales of love, loss and longing.'),
(17, 'The Father Who Moves Mountains', 'Daniel Sandu', 2021, 110, 'TV-MA', 'Dramas, International Movies, Thrillers', '', 'When his son goes missing during a snowy hike in the mountains, a retired intelligence officer will stop at nothing — and risk everything — to find him.');

CREATE TABLE IF NOT EXISTS watchlists (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    movie_id   INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_movie (user_id, movie_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed a default admin account.
-- Password is: Admin@1234
-- Generated with: password_hash('Admin@1234', PASSWORD_BCRYPT, ['cost' => 12])
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES (
    'admin',
    'admin@example.com',
    '$2y$12$L5bvvpMpV9ZfH2avLtDUCeborxvK6sGV3kKUBZJK8cr4vXg4zaHD2',
    'admin'
);
