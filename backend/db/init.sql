CREATE DATABASE streamselect;

\c streamselect;

CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    spotify_url VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 