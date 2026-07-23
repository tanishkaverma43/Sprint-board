const { query } = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { VALID_STATUSES } = require('../middleware/validateTask');

const TASK_COLUMNS = `
  id, title, description, status, priority,
  assignee_id AS "assigneeId", position,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

/**
 * GET /api/tasks
 * Supports optional query filters: status, priority, assigneeId, search.
 * Filtering also works server-side so the API stays useful beyond the
 * Angular client's own client-side search/filter requirement.
 */
const getAllTasks = asyncHandler(async (req, res) => {
  const { status, priority, assigneeId, search } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (priority) {
    params.push(priority);
    conditions.push(`priority = $${params.length}`);
  }
  if (assigneeId) {
    params.push(assigneeId);
    conditions.push(`assignee_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT ${TASK_COLUMNS} FROM tasks ${whereClause} ORDER BY status, position ASC, created_at ASC`,
    params
  );

  res.json({ data: rows, count: rows.length });
});

/** GET /api/tasks/:id */
const getTaskById = asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1`, [req.params.id]);

  if (rows.length === 0) {
    throw new ApiError(404, `Task with id ${req.params.id} was not found.`);
  }

  res.json({ data: rows[0] });
});

/** POST /api/tasks */
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description = null,
    status = 'todo',
    priority = 'medium',
    assigneeId = 'me',
  } = req.body;

  const { rows: positionRows } = await query(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM tasks WHERE status = $1',
    [status]
  );
  const position = positionRows[0].next_position;

  const { rows } = await query(
    `INSERT INTO tasks (title, description, status, priority, assignee_id, position)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${TASK_COLUMNS}`,
    [title.trim(), description, status, priority, assigneeId, position]
  );

  res.status(201).json({ data: rows[0] });
});

/**
 * PUT /api/tasks/:id
 * Full/partial update of task details (title, description, priority, assigneeId)
 * and optionally status/position too.
 */
const updateTask = asyncHandler(async (req, res) => {
  const fieldMap = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    assigneeId: 'assignee_id',
    position: 'position',
  };

  const setClauses = [];
  const params = [];

  for (const [bodyKey, column] of Object.entries(fieldMap)) {
    if (req.body[bodyKey] !== undefined) {
      params.push(bodyKey === 'title' ? req.body[bodyKey].trim() : req.body[bodyKey]);
      setClauses.push(`${column} = $${params.length}`);
    }
  }

  params.push(req.params.id);

  const { rows } = await query(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING ${TASK_COLUMNS}`,
    params
  );

  if (rows.length === 0) {
    throw new ApiError(404, `Task with id ${req.params.id} was not found.`);
  }

  res.json({ data: rows[0] });
});

/**
 * PATCH /api/tasks/:id/status
 * Lightweight endpoint dedicated to drag-and-drop moves: updates only the
 * column (status) and the ordering position within that column.
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, position } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `status is required and must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  if (typeof position !== 'number' || Number.isNaN(position) || position < 0) {
    throw new ApiError(400, 'position is required and must be a non-negative number.');
  }

  const { rows } = await query(
    `UPDATE tasks SET status = $1, position = $2 WHERE id = $3 RETURNING ${TASK_COLUMNS}`,
    [status, position, req.params.id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, `Task with id ${req.params.id} was not found.`);
  }

  res.json({ data: rows[0] });
});

/** DELETE /api/tasks/:id */
const deleteTask = asyncHandler(async (req, res) => {
  const { rows } = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);

  if (rows.length === 0) {
    throw new ApiError(404, `Task with id ${req.params.id} was not found.`);
  }

  res.status(204).send();
});

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
