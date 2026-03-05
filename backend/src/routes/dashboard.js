const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const modeMiddleware = require('../middleware/modeMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

router.use(authMiddleware, modeMiddleware);

router.get('/', getDashboard);

module.exports = router;
