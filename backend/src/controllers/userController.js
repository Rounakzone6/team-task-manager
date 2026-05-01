const User = require('../models/User');

/**
 * @route   GET /api/users/search?q=email
 * @access  Private
 * @desc    Search users by name or email (for adding to projects)
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters.',
      });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name email avatar')
      .limit(10);

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Valid name required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=6366f1&color=fff&size=128`,
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
