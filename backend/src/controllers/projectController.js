const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// ── Helpers ───────────────────────────────────────────────────────────────────

const populateProject = (query) =>
  query
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

const getTaskCounts = async (projectId) => {
  const agg = await Task.aggregate([
    { $match: { project: projectId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const counts = { todo: 0, 'in-progress': 0, completed: 0 };
  agg.forEach(({ _id, count }) => { counts[_id] = count; });
  return counts;
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await populateProject(
      Project.find({ 'members.user': req.user._id }).sort('-createdAt')
    );

    const data = await Promise.all(
      projects.map(async (p) => ({
        ...p.toObject(),
        taskCounts: await getTaskCounts(p._id),
      }))
    );

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, dueDate } = req.body;

    const project = await Project.create({
      name,
      description,
      dueDate: dueDate || null,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    const populated = await populateProject(Project.findById(project._id));
    const data = { ...populated.toObject(), taskCounts: { todo: 0, 'in-progress': 0, completed: 0 } };

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/projects/:id
 * @access  Private (project member)
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await populateProject(Project.findById(req.params.id));
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/projects/:id
 * @access  Private (admin only — enforced by middleware)
 */
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, status, dueDate } = req.body;
    const project = await populateProject(
      Project.findByIdAndUpdate(
        req.params.id,
        { name, description, status, dueDate: dueDate || null },
        { new: true, runValidators: true }
      )
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/projects/:id
 * @access  Private (admin only)
 */
exports.deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project and all associated tasks deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/projects/:id/members
 * @access  Private (admin only)
 */
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = req.project;

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId
    );
    if (alreadyMember) {
      return res
        .status(400)
        .json({ success: false, message: 'User is already a project member.' });
    }

    project.members.push({ user: userId, role });
    await project.save();

    const populated = await populateProject(Project.findById(project._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (admin only)
 */
exports.removeMember = async (req, res, next) => {
  try {
    const project = req.project;
    const { userId } = req.params;

    if (userId === project.owner.toString()) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== userId
    );
    await project.save();

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err) {
    next(err);
  }
};
