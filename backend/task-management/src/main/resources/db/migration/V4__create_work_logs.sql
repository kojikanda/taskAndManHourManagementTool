CREATE TABLE work_logs (
    id         BIGSERIAL PRIMARY KEY,
    task_id    BIGINT NOT NULL REFERENCES tasks(id),
    user_id    BIGINT NOT NULL REFERENCES users(id),
    work_date  DATE NOT NULL,
    hours      NUMERIC(5, 1) NOT NULL,
    memo       TEXT,
    created_at TIMESTAMP
);
