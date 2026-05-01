const Task = require('../models/Task');
const Project = require('../models/Project');

// ── Helpers ───────────────────────────────────────────────────────────────────

const populateTask = (query) =>
  query
    .populate('project', 'name')
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar');

const getMemberRole = (project, userId) =>
  project.members.find((m) => m.user.toString() === userId.toString())?.role || null;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @route   GET /api/tasks
 * @access  Private
 * @query   project, status, priority, assignedTo
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo } = req.query;

    // Scope: only tasks from projects the user belongs to
    const userProjects = await Project.find(
      { 'members.user': req.user._id },
      '_id'
    );
    const projectIds = userProjects.map((p) => p._id);

    const filter = { project: { $in: projectIds } };
    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await populateTask(
      Task.find(filter).sort('-createdAt')
    );

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/tasks
 * @access  Private (project admin only)
 */
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate } =
      req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found.' });
    }

    const role = getMemberRole(project, req.user._id);
    if (!role) {
      return res
        .status(403)
        .json({ success: false, message: 'You are not a member of this project.' });
    }
    if (role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Only project admins can create tasks.' });
    }

    // Validate that the assignee is a project member
    if (assignedTo) {
      const isAssigneeMember = project.members.some(
        (m) => m.user.toString() === assignedTo
      );
      if (!isAssigneeMember) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must be a member of this project.',
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate: dueDate || null,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/tasks/:id
 * @access  Private (project member)
 */
exports.getTask = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found.' });
    }

    const project = await Project.findById(task.project._id);
    const role = getMemberRole(project, req.user._id);
    if (!role) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @access  Private
 *   - Admin: full update
 *   - Member: can only update status of their own assigned tasks
 */
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    const role = getMemberRole(project, req.user._id);

    if (!role) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (role === 'admin') {
      // Admins can update anything
      const { title, description, assignedTo, priority, dueDate, status } =
        req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (status !== undefined) task.status = status;
    } else {
      // Members can only update status of their own tasks
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you.',
        });
      }
      if (req.body.status) task.status = req.body.status;
    }

    await task.save();
    const populated = await populateTask(Task.findById(task._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @access  Private (admin only)
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    const role = getMemberRole(project, req.user._id);

    if (!role || role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Only project admins can delete tasks.' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/tasks/:id/status
 * @access  Private (admin or assignee)
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in-progress', 'completed'];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid status value.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found.' });
    }

    const project = await Project.findById(task.project);
    const role = getMemberRole(project, req.user._id);

    if (!role) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Members can only update tasks assigned to them
    if (
      role !== 'admin' &&
      task.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update status of tasks assigned to you.',
      });
    }

    task.status = status;
    await task.save();

    const populated = await populateTask(Task.findById(task._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
