const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getProfile, updateProfile, updateMode, updateUserTypes, updateAccessibility,
} = require('../controllers/userController');

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/settings/mode', updateMode);
router.put('/settings/user-types', updateUserTypes);
router.put('/settings/accessibility', updateAccessibility);

module.exports = router;
