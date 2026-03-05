const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../config/db');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT ge.*,
         COUNT(gem.id) AS member_count,
         COALESCE(SUM(gem.amount_owed), 0) AS total_owed,
         COALESCE(SUM(gem.amount_paid), 0) AS total_paid
       FROM group_expenses ge
       LEFT JOIN group_expense_members gem ON gem.group_expense_id = ge.id
       WHERE ge.created_by = $1
       GROUP BY ge.id ORDER BY ge.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch group expenses' }); }
});

router.post('/', async (req, res) => {
  const { title, description, totalAmount, categoryId, expenseDate, members = [] } = req.body;
  if (!title || !totalAmount) return res.status(400).json({ error: 'title and totalAmount required' });

  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { rows: [ge] } = await client.query(
      `INSERT INTO group_expenses (created_by, title, description, total_amount, category_id, expense_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.userId, title, description || null, parseFloat(totalAmount), categoryId || null, expenseDate || new Date()]
    );
    for (const m of members) {
      await client.query(
        `INSERT INTO group_expense_members (group_expense_id, user_id, name, email, amount_owed)
         VALUES ($1,$2,$3,$4,$5)`,
        [ge.id, m.userId || null, m.name, m.email || null, parseFloat(m.amountOwed || 0)]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(ge);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create group expense' });
  } finally {
    client.release();
  }
});

router.post('/:id/add-member', async (req, res) => {
  const { name, email, amountOwed, userId } = req.body;
  try {
    const { rows } = await query(
      `INSERT INTO group_expense_members (group_expense_id, user_id, name, email, amount_owed)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, userId || null, name, email || null, parseFloat(amountOwed || 0)]
    );
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Failed to add member' }); }
});

router.post('/:id/settle', async (req, res) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE group_expense_members SET amount_paid = amount_owed, settled_at = NOW()
       WHERE group_expense_id = $1`,
      [req.params.id]
    );
    const { rows } = await client.query(
      `UPDATE group_expenses SET status = 'settled' WHERE id = $1 AND created_by = $2 RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Group expense not found' }); }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to settle group expense' });
  } finally {
    client.release();
  }
});

router.get('/:id/calculations', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT gem.*, ge.total_amount, ge.title
       FROM group_expense_members gem
       JOIN group_expenses ge ON ge.id = gem.group_expense_id
       WHERE gem.group_expense_id = $1`,
      [req.params.id]
    );
    const totalOwed = rows.reduce((s, r) => s + parseFloat(r.amount_owed), 0);
    const totalPaid = rows.reduce((s, r) => s + parseFloat(r.amount_paid), 0);
    res.json({ members: rows, totalOwed, totalPaid, outstanding: totalOwed - totalPaid });
  } catch { res.status(500).json({ error: 'Failed to calculate' }); }
});

module.exports = router;
