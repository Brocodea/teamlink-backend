const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const Membership = require('../models/Membership');
const { createNotification } = require('../utils/notification');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Team member)
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, teamId, assignedTo } = req.body;

    if (!title || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and team'
      });
    }

    // Find team by teamId (not _id)
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member of the team
    const membership = await Membership.findOne({
      team: team._id,
      user: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // If assignedTo is provided, verify they are a team member
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findOne({ userId: assignedTo });
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }

      const assignedMembership = await Membership.findOne({
        team: team._id,
        user: assignedUser._id
      });

      if (!assignedMembership) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user is not a member of this team'
        });
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate,
      team: team._id,
      assignedTo: assignedUser ? assignedUser._id : null,
      createdBy: req.user._id
    });

    // Send notification if task is assigned
    if (assignedUser) {
      await createNotification(
        assignedUser._id,
        'task_assigned',
        `You have been assigned a new task: ${task.title}`,
        task.taskId
      );
    }


    // Populate references
    await task.populate('assignedTo', 'userId name email');
    await task.populate('createdBy', 'userId name email');
    await task.populate('team', 'teamId name');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        team: task.team,
        assignedTo: task.assignedTo,
        createdBy: task.createdBy,
        createdAt: task.createdAt
      }
    });

  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task',
      error: error.message
    });
  }
};

// @desc    Get my tasks
// @route   GET /api/tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const { status, priority, teamId } = req.query;

    const query = {
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (teamId) {
      const team = await Team.findOne({ teamId });
      if (team) query.team = team._id;
    }

    const tasks = await Task.find(query)
      .populate('team', 'teamId name')               // 🆕 ADD THIS LINE
      .populate('assignedTo', 'userId name email')   // 🆕 ADD THIS LINE
      .populate('createdBy', 'userId name email')    // 🆕 ADD THIS LINE
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get My Tasks Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks',
      error: error.message
    });
  }
};


// @desc    Get team tasks
// @route   GET /api/tasks/team/:teamId/tasks
// @access  Private
exports.getTeamTasks = async (req, res) => {
  try {
    let teamId = req.params.teamId;
    
    let team;
    if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
      team = await Team.findById(teamId);
    } else {
      team = await Team.findOne({ teamId });
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const isMember = await Membership.findOne({
      team: team._id,
      user: req.user._id
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    const tasks = await Task.find({ team: team._id })
      .populate('team', 'teamId name')               // 🆕 ADD THIS LINE
      .populate('assignedTo', 'userId name email')   // 🆕 ADD THIS LINE
      .populate('createdBy', 'userId name email')    // 🆕 ADD THIS LINE
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get Team Tasks Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private (Team member)
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('team', 'teamId name')
      .populate('assignedTo', 'userId name email')
      .populate('createdBy', 'userId name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is a team member
    const membership = await Membership.findOne({
      team: task.team._id,
      user: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Get Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Team member)
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is a team member
    const membership = await Membership.findOne({
      team: task.team,
      user: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this task'
      });
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    const fieldsToUpdate = {};
    if (title) fieldsToUpdate.title = title;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (status) fieldsToUpdate.status = status;
    if (priority) fieldsToUpdate.priority = priority;
    if (dueDate !== undefined) fieldsToUpdate.dueDate = dueDate;

    // Handle assignedTo update
    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        fieldsToUpdate.assignedTo = null;
      } else {
        const assignedUser = await User.findOne({ userId: assignedTo });
        if (!assignedUser) {
          return res.status(404).json({
            success: false,
            message: 'Assigned user not found'
          });
        }

        const assignedMembership = await Membership.findOne({
          team: task.team,
          user: assignedUser._id
        });

        if (!assignedMembership) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user is not a member of this team'
          });
        }

        fieldsToUpdate.assignedTo = assignedUser._id;
      }
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('team', 'teamId name')
      .populate('assignedTo', 'userId name email')
      .populate('createdBy', 'userId name email');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });

  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task',
      error: error.message
    });
  }
};

// @desc    Update task status only
// @route   PATCH /api/tasks/:id/status
// @access  Private (Assigned user or team member)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['To Do', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (To Do, In Progress, Completed)'
      });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is a team member
    const membership = await Membership.findOne({
      team: task.team,
      user: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this task'
      });
    }

    task.status = status;
    await task.save();

    await task.populate('team', 'teamId name');
    await task.populate('assignedTo', 'userId name email');
    await task.populate('createdBy', 'userId name email');

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });

  } catch (error) {
    console.error('Update Task Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task status',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Creator or Admin)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is the creator or team admin
    const membership = await Membership.findOne({
      team: task.team,
      user: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this task'
      });
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdmin = membership.role === 'Admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only task creator or team admin can delete this task'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task',
      error: error.message
    });
  }
};