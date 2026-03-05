const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../config/db');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM insights WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch insights' }); }
});

router.put('/:id/mark-read', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE insights SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Insight not found' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Failed to mark insight as read' }); }
});

module.exports = router;
