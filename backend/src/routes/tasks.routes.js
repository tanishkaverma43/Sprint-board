const express = require('express');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/tasks.controller');
const {
  validateCreateTask,
  validateUpdateTask,
  validateIdParam,
} = require('../middleware/validateTask');

const router = express.Router();

router.get('/', getAllTasks);
router.post('/', validateCreateTask, createTask);

router.get('/:id', validateIdParam, getTaskById);
router.put('/:id', validateIdParam, validateUpdateTask, updateTask);
router.patch('/:id/status', validateIdParam, updateTaskStatus);
router.delete('/:id', validateIdParam, deleteTask);

module.exports = router;
