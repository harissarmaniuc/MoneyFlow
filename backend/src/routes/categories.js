const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getCategories, createCategory, getSubcategories } = require('../controllers/categoryController');

router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', createCategory);
router.get('/subcategories/:categoryId', getSubcategories);

module.exports = router;
