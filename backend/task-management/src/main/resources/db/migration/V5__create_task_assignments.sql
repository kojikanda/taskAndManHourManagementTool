CREATE TABLE task_assignments (
    id      BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    UNIQUE (task_id, user_id)
);
