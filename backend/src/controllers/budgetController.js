const { query } = require('../config/db');

const formatBudget = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryEmoji: row.category_emoji,
  categoryColor: row.category_color,
  amount: parseFloat(row.amount),
  period: row.period,
  month: row.month,
  isOverall: row.is_overall,
  spent: parseFloat(row.spent || 0),
  remaining: parseFloat(row.remaining || row.amount),
  percentageUsed: parseFloat(row.percentage_used || 0),
  createdAt: row.created_at,
});

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// POST /budgets
const createBudget = async (req, res) => {
  const { categoryId, amount, period = 'monthly', month, isOverall = false } = req.body;
  if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const budgetMonth = month || currentMonth();

  try {
    const { rows } = await query(
      `INSERT INTO budgets (user_id, category_id, amount, period, month, is_overall)
       VALUES ($1, $2, $3, $4, $5::date, $6)
       ON CONFLICT (user_id, category_id, month) DO UPDATE SET amount = EXCLUDED.amount
       RETURNING *`,
      [req.user.userId, categoryId || null, parseFloat(amount), period, budgetMonth, isOverall]
    );
    res.status(201).json(formatBudget(rows[0]));
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

// GET /budgets
const getBudgets = async (req, res) => {
  const { month } = req.query;
  const budgetMonth = month || currentMonth();

  try {
    const { rows } = await query(
      `SELECT
         b.*,
         c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color,
         COALESCE(SUM(t.amount), 0) AS spent,
         b.amount - COALESCE(SUM(t.amount), 0) AS remaining,
         CASE WHEN b.amount > 0
           THEN ROUND(COALESCE(SUM(t.amount), 0) / b.amount * 100, 1)
           ELSE 0
         END AS percentage_used
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND (b.category_id IS NULL OR t.category_id = b.category_id)
         AND t.type = 'expense'
         AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', $2::date)
       WHERE b.user_id = $1
         AND (b.month = $2::date OR b.month IS NULL)
       GROUP BY b.id, c.name, c.emoji, c.color
       ORDER BY b.is_overall DESC, c.name`,
      [req.user.userId, budgetMonth]
    );
    res.json(rows.map(formatBudget));
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

// PUT /budgets/:id
const updateBudget = async (req, res) => {
  const { amount, period } = req.body;
  const updates = [];
  const values = [req.params.id, req.user.userId];
  let idx = 3;

  if (amount) { updates.push(`amount = $${idx++}`); values.push(parseFloat(amount)); }
  if (period) { updates.push(`period = $${idx++}`); values.push(period); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  try {
    const { rows } = await query(
      `UPDATE budgets SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json(formatBudget(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

// DELETE /budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

// GET /budgets/:id/progress
const getBudgetProgress = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         b.*,
         COALESCE(SUM(t.amount), 0) AS spent,
         b.amount - COALESCE(SUM(t.amount), 0) AS remaining,
         ROUND(COALESCE(SUM(t.amount), 0) / b.amount * 100, 1) AS percentage_used
       FROM budgets b
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND (b.category_id IS NULL OR t.category_id = b.category_id)
         AND t.type = 'expense'
         AND (b.month IS NULL OR DATE_TRUNC('month', t.transaction_date) = b.month)
       WHERE b.id = $1 AND b.user_id = $2
       GROUP BY b.id`,
      [req.params.id, req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
    res.json(formatBudget(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get budget progress' });
  }
};

module.exports = { createBudget, getBudgets, updateBudget, deleteBudget, getBudgetProgress };
