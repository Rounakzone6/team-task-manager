const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect — verifies JWT and attaches req.user
 */
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

/**
 * projectAdmin — requires the user to be an admin of req.project
 * Must be used AFTER the loadProject middleware
 */
exports.projectAdmin = (req, res, next) => {
  const project = req.project;
  if (!project) {
    return res
      .status(500)
      .json({ success: false, message: 'Project middleware not loaded.' });
  }

  const member = project.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!member || member.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required for this action.',
    });
  }

  next();
};

/**
 * projectMember — requires the user to be any member of req.project
 */
exports.projectMember = (req, res, next) => {
  const project = req.project;
  if (!project) {
    return res
      .status(500)
      .json({ success: false, message: 'Project middleware not loaded.' });
  }

  const isMember = project.members.some(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not a member of this project.',
    });
  }

  next();
};
