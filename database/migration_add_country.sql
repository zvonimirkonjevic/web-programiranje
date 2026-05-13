USE imdb_app;

ALTER TABLE movies ADD COLUMN country VARCHAR(255) NOT NULL DEFAULT '' AFTER genre;

UPDATE movies SET country = 'United States' WHERE id = 1;
UPDATE movies SET country = '' WHERE id = 2;
UPDATE movies SET country = 'United States, Ghana, Burkina Faso, United Kingdom, Germany, Ethiopia' WHERE id = 3;
UPDATE movies SET country = 'United States' WHERE id = 4;
UPDATE movies SET country = 'Germany, Czech Republic' WHERE id = 5;
UPDATE movies SET country = '' WHERE id = 6;
UPDATE movies SET country = '' WHERE id = 7;
UPDATE movies SET country = '' WHERE id = 8;
UPDATE movies SET country = '' WHERE id = 9;
UPDATE movies SET country = '' WHERE id = 10;
UPDATE movies SET country = 'India' WHERE id = 11;
UPDATE movies SET country = '' WHERE id = 12;
UPDATE movies SET country = 'United States' WHERE id = 13;
UPDATE movies SET country = 'United States' WHERE id = 14;
UPDATE movies SET country = 'United States, India, France' WHERE id = 15;
UPDATE movies SET country = '' WHERE id = 16;
UPDATE movies SET country = '' WHERE id = 17;
