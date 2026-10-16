const express = require('express');
const router = express.Router();
const {
  createTask,
  getMyTasks,
  getTeamTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { isMember } = require('../middleware/teamAuth');

// Task routes
router.post('/', protect, createTask);
router.get('/', protect, getMyTasks);
router.get('/:id', protect, getTask);
router.put('/:id', protect, updateTask);
router.patch('/:id/status', protect, updateTaskStatus);
router.delete('/:id', protect, deleteTask);

// Team tasks route
router.get('/team/:teamId/tasks', protect, getTeamTasks);

module.exports = router;