const { query } = require('../config/db');

const formatTransaction = (row) => ({
  id: row.id,
  amount: parseFloat(row.amount),
  type: row.type,
  description: row.description,
  merchantName: row.merchant_name,
  paymentMethod: row.payment_method,
  date: row.transaction_date,
  categoryId: row.category_id,
  categoryName: row.category_name,
  categoryEmoji: row.category_emoji,
  categoryColor: row.category_color,
  subcategoryId: row.subcategory_id,
  subcategoryName: row.subcategory_name,
  receiptUrl: row.receipt_url,
  notes: row.notes,
  isRecurring: row.is_recurring,
  recurringFrequency: row.recurring_frequency,
  tags: row.tags,
  createdAt: row.created_at,
});

// POST /transactions
const createTransaction = async (req, res) => {
  const {
    amount, type = 'expense', description, merchantName,
    paymentMethod, date, categoryId, subcategoryId,
    receiptUrl, notes, isRecurring = false, recurringFrequency, tags = [],
  } = req.body;

  if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

  const txDate = date || new Date().toISOString().slice(0, 10);

  try {
    const { rows } = await query(
      `INSERT INTO transactions
         (user_id, amount, type, description, merchant_name, payment_method,
          transaction_date, category_id, subcategory_id, receipt_url,
          notes, is_recurring, recurring_frequency, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        req.user.userId, parseFloat(amount), type, description || null,
        merchantName || null, paymentMethod || null, txDate,
        categoryId || null, subcategoryId || null, receiptUrl || null,
        notes || null, isRecurring, recurringFrequency || null, JSON.stringify(tags),
      ]
    );

    // Check if any budget is now exceeded and create an insight
    if (type === 'expense' && categoryId) {
      checkBudgetAlert(req.user.userId, categoryId, txDate).catch(() => {});
    }

    res.status(201).json(formatTransaction(rows[0]));
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

// GET /transactions
const getTransactions = async (req, res) => {
  const {
    category_id, month, type, search,
    page = 1, limit = 20, sort = 'date_desc',
  } = req.query;

  const conditions = ['t.user_id = $1'];
  const values = [req.user.userId];
  let idx = 2;

  if (category_id) { conditions.push(`t.category_id = $${idx++}`); values.push(category_id); }
  if (type) { conditions.push(`t.type = $${idx++}`); values.push(type); }
  if (month) {
    conditions.push(`DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', $${idx++}::date)`);
    values.push(month + '-01');
  }
  if (search) {
    conditions.push(`(t.description ILIKE $${idx} OR t.merchant_name ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const orderMap = {
    date_desc: 't.transaction_date DESC, t.created_at DESC',
    date_asc: 't.transaction_date ASC, t.created_at ASC',
    amount_desc: 't.amount DESC',
    amount_asc: 't.amount ASC',
  };
  const orderBy = orderMap[sort] || orderMap.date_desc;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM transactions t WHERE ${conditions.join(' AND ')}`,
      values
    );

    const { rows } = await query(
      `SELECT t.*,
         c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color,
         s.name AS subcategory_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN subcategories s ON s.id = t.subcategory_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      transactions: rows.map(formatTransaction),
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// GET /transactions/recurring
const getRecurringTransactions = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*,
         c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.is_recurring = true
       ORDER BY t.transaction_date DESC`,
      [req.user.userId]
    );
    res.json(rows.map(formatTransaction));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
};

// PUT /transactions/:id
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const allowed = ['amount', 'type', 'description', 'merchant_name', 'payment_method',
    'transaction_date', 'category_id', 'subcategory_id', 'notes', 'is_recurring',
    'recurring_frequency', 'tags', 'receipt_url'];

  const updates = {};
  const fieldMap = {
    amount: 'amount', type: 'type', description: 'description',
    merchantName: 'merchant_name', paymentMethod: 'payment_method',
    date: 'transaction_date', categoryId: 'category_id',
    subcategoryId: 'subcategory_id', notes: 'notes',
    isRecurring: 'is_recurring', recurringFrequency: 'recurring_frequency',
    tags: 'tags', receiptUrl: 'receipt_url',
  };

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (req.body[jsKey] !== undefined) updates[dbCol] = req.body[jsKey];
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
  if (updates.amount && parseFloat(updates.amount) <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const setClauses = Object.keys(updates).map((col, i) => `${col} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(updates), req.user.userId];

  try {
    const { rows } = await query(
      `UPDATE transactions SET ${setClauses}
       WHERE id = $1 AND user_id = $${values.length}
       RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(formatTransaction(rows[0]));
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// DELETE /transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// Helper: check if a budget was exceeded after a new transaction
async function checkBudgetAlert(userId, categoryId, txDate) {
  const month = txDate.slice(0, 7) + '-01';
  const { rows: budgets } = await query(
    `SELECT b.id, b.amount, b.category_id,
       COALESCE(SUM(t.amount), 0) AS spent
     FROM budgets b
     LEFT JOIN transactions t
       ON t.user_id = b.user_id
       AND (b.category_id IS NULL OR t.category_id = b.category_id)
       AND t.type = 'expense'
       AND DATE_TRUNC('month', t.transaction_date) = $3::date
     WHERE b.user_id = $1
       AND (b.category_id = $2 OR b.category_id IS NULL)
       AND (b.month = $3::date OR b.month IS NULL)
     GROUP BY b.id, b.amount, b.category_id`,
    [userId, categoryId, month]
  );

  for (const budget of budgets) {
    const pct = (parseFloat(budget.spent) / parseFloat(budget.amount)) * 100;
    if (pct >= 100) {
      await query(
        `INSERT INTO insights (user_id, category_id, type, title, body, data)
         VALUES ($1, $2, 'budget_exceeded', 'Budget Exceeded', $3, $4)
         ON CONFLICT DO NOTHING`,
        [
          userId, budget.category_id,
          `You've gone over your budget${budget.category_id ? ' for this category' : ''}.`,
          JSON.stringify({ budgetId: budget.id, spent: budget.spent, limit: budget.amount }),
        ]
      );
    } else if (pct >= 80) {
      await query(
        `INSERT INTO insights (user_id, category_id, type, title, body, data)
         VALUES ($1, $2, 'budget_warning', '80% of Budget Used', $3, $4)
         ON CONFLICT DO NOTHING`,
        [
          userId, budget.category_id,
          `You're at ${Math.round(pct)}% of your budget. Slow down spending to stay on track.`,
          JSON.stringify({ budgetId: budget.id, spent: budget.spent, limit: budget.amount, pct }),
        ]
      );
    }
  }
}

module.exports = { createTransaction, getTransactions, getRecurringTransactions, updateTransaction, deleteTransaction };
