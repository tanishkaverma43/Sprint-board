const { ApiError } = require('./errorHandler');

const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

/** Validates the body of a POST /api/tasks request. */
function validateCreateTask(req, res, next) {
  const { title, description, status, priority, assigneeId } = req.body;
  const errors = [];

  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title is required and must be a non-empty string.');
  } else if (title.trim().length > 120) {
    errors.push('title must be 120 characters or fewer.');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('description must be a string.');
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (assigneeId !== undefined && typeof assigneeId !== 'string') {
    errors.push('assigneeId must be a string.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
}

/** Validates the body of a PUT/PATCH /api/tasks/:id request (all fields optional). */
function validateUpdateTask(req, res, next) {
  const { title, description, status, priority, assigneeId, position } = req.body;
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    errors.push('title must be a non-empty string.');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('description must be a string.');
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (assigneeId !== undefined && typeof assigneeId !== 'string') {
    errors.push('assigneeId must be a string.');
  }

  if (position !== undefined && (typeof position !== 'number' || Number.isNaN(position))) {
    errors.push('position must be a number.');
  }

  if (Object.keys(req.body).length === 0) {
    errors.push('Request body must include at least one field to update.');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
}

/** Validates the :id route param is a positive integer. */
function validateIdParam(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return next(new ApiError(400, `Invalid task id "${req.params.id}".`));
  }
  next();
}

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  validateCreateTask,
  validateUpdateTask,
  validateIdParam,
};
