const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../config/db');

router.use(authMiddleware);

const fmt = (r) => ({
  id: r.id, title: r.title, description: r.description, type: r.type,
  targetAmount: parseFloat(r.target_amount), currentAmount: parseFloat(r.current_amount),
  percentage: Math.round((parseFloat(r.current_amount) / parseFloat(r.target_amount)) * 100),
  targetDate: r.target_date, status: r.status, categoryId: r.category_id,
  createdAt: r.created_at,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(rows.map(fmt));
  } catch { res.status(500).json({ error: 'Failed to fetch goals' }); }
});

router.post('/', async (req, res) => {
  const { title, description, type = 'savings', targetAmount, currentAmount = 0, targetDate, categoryId } = req.body;
  if (!title || !targetAmount) return res.status(400).json({ error: 'title and targetAmount required' });
  try {
    const { rows } = await query(
      `INSERT INTO goals (user_id, title, description, type, target_amount, current_amount, target_date, category_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.userId, title, description || null, type, parseFloat(targetAmount), parseFloat(currentAmount), targetDate || null, categoryId || null]
    );
    res.status(201).json(fmt(rows[0]));
  } catch { res.status(500).json({ error: 'Failed to create goal' }); }
});

router.put('/:id', async (req, res) => {
  const { title, currentAmount, targetAmount, status, targetDate } = req.body;
  const fields = [], vals = [req.params.id, req.user.userId];
  let i = 3;
  if (title) { fields.push(`title = $${i++}`); vals.push(title); }
  if (currentAmount !== undefined) { fields.push(`current_amount = $${i++}`); vals.push(parseFloat(currentAmount)); }
  if (targetAmount) { fields.push(`target_amount = $${i++}`); vals.push(parseFloat(targetAmount)); }
  if (status) { fields.push(`status = $${i++}`); vals.push(status); }
  if (targetDate) { fields.push(`target_date = $${i++}`); vals.push(targetDate); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  try {
    const { rows } = await query(
      `UPDATE goals SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Goal not found' });
    res.json(fmt(rows[0]));
  } catch { res.status(500).json({ error: 'Failed to update goal' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (!rowCount) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete goal' }); }
});

module.exports = router;
