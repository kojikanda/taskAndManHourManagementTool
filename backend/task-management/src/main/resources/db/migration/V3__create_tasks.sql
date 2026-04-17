CREATE TABLE tasks (
    id               BIGSERIAL PRIMARY KEY,
    project_id       BIGINT NOT NULL REFERENCES projects(id),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'TODO',
    priority         VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    due_date         DATE,
    estimated_hours  NUMERIC(5, 1),
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);
