const express = require('express');
const { protect } = require('../middleware/auth');
const { searchUsers, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.put('/profile', updateProfile);

module.exports = router;
