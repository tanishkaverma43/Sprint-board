-- Migration: 002_seed_tasks
-- Optional sample data so the board isn't empty on first run.

INSERT INTO tasks (title, description, status, priority, assignee_id, position) VALUES
    ('Set up project repository', 'Initialize Angular + Node workspaces and shared tooling.', 'done', 'medium', 'me', 0),
    ('Design database schema', 'Model the tasks table with status/priority enums.', 'done', 'high', 'me', 1),
    ('Build REST API for tasks', 'CRUD endpoints with validation and error handling.', 'in-progress', 'high', 'me', 0),
    ('Implement drag-and-drop board', 'Use Angular CDK to move cards between columns.', 'in-progress', 'medium', 'teammate', 1),
    ('Add search & filter bar', 'Client-side filtering by title and priority.', 'todo', 'medium', 'me', 0),
    ('Write README & setup docs', 'Document local setup for backend and frontend.', 'todo', 'low', 'teammate', 1)
ON CONFLICT DO NOTHING;
