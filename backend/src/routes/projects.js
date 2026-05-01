const express = require('express');
const Project = require('../models/Project');
const { protect, projectAdmin } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');

const router = express.Router();

// ── Middleware: load project and attach to req ─────────────────────────────
const loadProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Routes ────────────────────────────────────────────────────────────────────
router.use(protect); // all project routes require login

router.route('/').get(getProjects).post(createProject);

router
  .route('/:id')
  .get(getProject)
  .put(loadProject, projectAdmin, updateProject)
  .delete(loadProject, projectAdmin, deleteProject);

// Member management (admin only)
router
  .route('/:id/members')
  .post(loadProject, projectAdmin, addMember);

router
  .route('/:id/members/:userId')
  .delete(loadProject, projectAdmin, removeMember);

module.exports = router;
