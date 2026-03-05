const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../config/db');

router.use(authMiddleware);

const fmt = (r) => ({
  id: r.id, name: r.name, amount: parseFloat(r.amount), frequency: r.frequency,
  nextBillingDate: r.next_billing_date, lastBillingDate: r.last_billing_date,
  status: r.status, notes: r.notes, categoryId: r.category_id,
  categoryName: r.category_name, categoryEmoji: r.category_emoji,
  createdAt: r.created_at,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, c.name AS category_name, c.emoji AS category_emoji
       FROM subscriptions s LEFT JOIN categories c ON c.id = s.category_id
       WHERE s.user_id = $1 ORDER BY s.next_billing_date ASC`,
      [req.user.userId]
    );
    res.json(rows.map(fmt));
  } catch { res.status(500).json({ error: 'Failed to fetch subscriptions' }); }
});

router.post('/', async (req, res) => {
  const { name, amount, frequency = 'monthly', nextBillingDate, categoryId, notes } = req.body;
  if (!name || !amount) return res.status(400).json({ error: 'name and amount required' });
  try {
    const { rows } = await query(
      `INSERT INTO subscriptions (user_id, name, amount, frequency, next_billing_date, category_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.userId, name, parseFloat(amount), frequency, nextBillingDate || null, categoryId || null, notes || null]
    );
    res.status(201).json(fmt(rows[0]));
  } catch { res.status(500).json({ error: 'Failed to create subscription' }); }
});

router.put('/:id', async (req, res) => {
  const { name, amount, frequency, status, nextBillingDate } = req.body;
  const fields = [], vals = [req.params.id, req.user.userId];
  let i = 3;
  if (name) { fields.push(`name = $${i++}`); vals.push(name); }
  if (amount) { fields.push(`amount = $${i++}`); vals.push(parseFloat(amount)); }
  if (frequency) { fields.push(`frequency = $${i++}`); vals.push(frequency); }
  if (status) { fields.push(`status = $${i++}`); vals.push(status); }
  if (nextBillingDate) { fields.push(`next_billing_date = $${i++}`); vals.push(nextBillingDate); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  try {
    const { rows } = await query(
      `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Subscription not found' });
    res.json(fmt(rows[0]));
  } catch { res.status(500).json({ error: 'Failed to update subscription' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM subscriptions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    if (!rowCount) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ error: 'Failed to delete subscription' }); }
});

module.exports = router;
