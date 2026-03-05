const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../config/db');

router.use(authMiddleware);

// GET /analytics/spending-patterns  — last N months by category
router.get('/spending-patterns', async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  try {
    const { rows } = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'YYYY-MM') AS month,
         c.id AS category_id, c.name AS category_name, c.emoji, c.color,
         SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.type = 'expense'
         AND t.transaction_date >= DATE_TRUNC('month', NOW()) - (($2 - 1) || ' months')::interval
       GROUP BY DATE_TRUNC('month', t.transaction_date), c.id
       ORDER BY month, total DESC`,
      [req.user.userId, months]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch spending patterns' }); }
});

// GET /analytics/category-trends
router.get('/category-trends', async (req, res) => {
  const { categoryId, months = 6 } = req.query;
  try {
    const cond = categoryId ? 'AND t.category_id = $3' : '';
    const vals = [req.user.userId, parseInt(months)];
    if (categoryId) vals.push(categoryId);

    const { rows } = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS month,
         SUM(amount) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND transaction_date >= DATE_TRUNC('month', NOW()) - (($2 - 1) || ' months')::interval
         ${cond}
       GROUP BY DATE_TRUNC('month', transaction_date)
       ORDER BY month`,
      vals
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch category trends' }); }
});

module.exports = router;
