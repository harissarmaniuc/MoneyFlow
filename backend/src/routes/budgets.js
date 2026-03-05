const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createBudget, getBudgets, updateBudget, deleteBudget, getBudgetProgress } = require('../controllers/budgetController');

router.use(authMiddleware);

router.post('/', createBudget);
router.get('/', getBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);
router.get('/:id/progress', getBudgetProgress);

module.exports = router;
