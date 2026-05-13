USE imdb_app;

ALTER TABLE movies
    ADD COLUMN score DECIMAL(3,1) NOT NULL DEFAULT 0.0 AFTER description;

UPDATE movies SET score = 7.3 WHERE id = 1;
UPDATE movies SET score = 6.1 WHERE id = 2;
UPDATE movies SET score = 7.8 WHERE id = 3;
UPDATE movies SET score = 5.8 WHERE id = 4;
UPDATE movies SET score = 6.9 WHERE id = 5;
UPDATE movies SET score = 5.2 WHERE id = 6;
UPDATE movies SET score = 7.1 WHERE id = 7;
UPDATE movies SET score = 4.9 WHERE id = 8;
UPDATE movies SET score = 7.2 WHERE id = 9;
UPDATE movies SET score = 4.5 WHERE id = 10;
UPDATE movies SET score = 7.0 WHERE id = 11;
UPDATE movies SET score = 7.4 WHERE id = 12;
UPDATE movies SET score = 6.0 WHERE id = 13;
UPDATE movies SET score = 6.2 WHERE id = 14;
UPDATE movies SET score = 5.0 WHERE id = 15;
UPDATE movies SET score = 7.0 WHERE id = 16;
UPDATE movies SET score = 6.7 WHERE id = 17;
