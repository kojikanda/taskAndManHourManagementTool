CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);
