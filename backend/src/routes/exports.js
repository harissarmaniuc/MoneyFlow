const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { query } = require('../config/db');

router.use(authMiddleware);

// POST /exports/csv|pdf|excel — create an export job
const createExport = (format) => async (req, res) => {
  const { filters = {} } = req.body;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  try {
    const { rows } = await query(
      `INSERT INTO export_requests (user_id, format, filters, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.userId, format, JSON.stringify(filters), expiresAt]
    );
    // In production: trigger background job (worker/queue) to generate file
    // For now, return the job ID and status
    res.status(202).json({
      exportId: rows[0].id,
      status: 'pending',
      message: 'Export job queued. Check status at /exports/:id/download',
    });
  } catch { res.status(500).json({ error: 'Failed to queue export' }); }
};

router.post('/csv', createExport('csv'));
router.post('/pdf', createExport('pdf'));
router.post('/excel', createExport('excel'));

// GET /exports/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM export_requests WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Export not found' });
    const exp = rows[0];
    if (exp.status === 'pending' || exp.status === 'processing') {
      return res.json({ status: exp.status, message: 'Export still processing' });
    }
    if (exp.status === 'failed') return res.status(500).json({ error: 'Export failed' });
    res.json({ status: 'ready', fileUrl: exp.file_url });
  } catch { res.status(500).json({ error: 'Failed to check export' }); }
});

module.exports = router;
