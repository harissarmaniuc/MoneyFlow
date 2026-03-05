const { query } = require('../config/db');

const currentMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// GET /dashboard?mode=simple|detailed
const getDashboard = async (req, res) => {
  const userId = req.user.userId;
  const mode = req.userMode || 'simple';
  const month = req.query.month || currentMonthStart();

  try {
    if (mode === 'simple') {
      return await getSimpleDashboard(userId, month, res);
    }
    return await getDetailedDashboard(userId, month, res);
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

async function getSimpleDashboard(userId, month, res) {
  // 1. Total spent this month
  const { rows: spendRows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total_spent
     FROM transactions
     WHERE user_id = $1 AND type = 'expense'
       AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', $2::date)`,
    [userId, month]
  );

  // 2. Overall budget
  const { rows: budgetRows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total_budget
     FROM budgets
     WHERE user_id = $1 AND is_overall = true
       AND (month = $2::date OR month IS NULL)`,
    [userId, month]
  );

  // 3. Last 5 transactions
  const { rows: txRows } = await query(
    `SELECT t.*, c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT 5`,
    [userId]
  );

  const totalSpent = parseFloat(spendRows[0].total_spent);
  const totalBudget = parseFloat(budgetRows[0]?.total_budget || 0);

  res.json({
    mode: 'simple',
    month,
    spent: totalSpent,
    budget: totalBudget,
    remaining: totalBudget > 0 ? totalBudget - totalSpent : null,
    percentageUsed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : null,
    recentTransactions: txRows.map((t) => ({
      id: t.id,
      amount: parseFloat(t.amount),
      type: t.type,
      categoryName: t.category_name,
      categoryEmoji: t.category_emoji,
      categoryColor: t.category_color,
      date: t.transaction_date,
      description: t.description,
    })),
  });
}

async function getDetailedDashboard(userId, month, res) {
  // Fetch all in parallel
  const [spendByCategory, budgets, recentTx, last6Months, goals, insights] = await Promise.all([
    // Spending by category this month
    query(
      `SELECT c.id, c.name, c.emoji, c.color, COALESCE(SUM(t.amount), 0) AS spent
       FROM categories c
       LEFT JOIN transactions t
         ON t.category_id = c.id AND t.user_id = $1 AND t.type = 'expense'
         AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', $2::date)
       WHERE (c.user_id = $1 OR c.user_id IS NULL) AND c.is_income = false AND c.is_default = true
       GROUP BY c.id
       ORDER BY spent DESC`,
      [userId, month]
    ),

    // Budgets with progress
    query(
      `SELECT b.*, c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color,
         COALESCE(SUM(t.amount), 0) AS spent,
         ROUND(COALESCE(SUM(t.amount), 0) / NULLIF(b.amount, 0) * 100, 1) AS pct
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND (b.category_id IS NULL OR t.category_id = b.category_id)
         AND t.type = 'expense'
         AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', $2::date)
       WHERE b.user_id = $1 AND (b.month = $2::date OR b.month IS NULL)
       GROUP BY b.id, c.name, c.emoji, c.color
       ORDER BY b.is_overall DESC, c.name`,
      [userId, month]
    ),

    // Last 10 transactions
    query(
      `SELECT t.*, c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT 10`,
      [userId]
    ),

    // Monthly totals for last 6 months (for trend chart)
    query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS month,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income
       FROM transactions
       WHERE user_id = $1
         AND transaction_date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
       GROUP BY DATE_TRUNC('month', transaction_date)
       ORDER BY 1`,
      [userId]
    ),

    // Active goals
    query(
      `SELECT * FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 3`,
      [userId]
    ),

    // Unread insights
    query(
      `SELECT * FROM insights WHERE user_id = $1 AND is_read = false
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    ),
  ]);

  const totalSpent = spendByCategory.rows.reduce((sum, r) => sum + parseFloat(r.spent), 0);
  const overallBudget = budgets.rows.find((b) => b.is_overall);

  res.json({
    mode: 'detailed',
    month,
    summary: {
      totalSpent,
      totalBudget: overallBudget ? parseFloat(overallBudget.amount) : null,
      remaining: overallBudget ? parseFloat(overallBudget.amount) - totalSpent : null,
    },
    spendingByCategory: spendByCategory.rows.map((r) => ({
      id: r.id, name: r.name, emoji: r.emoji, color: r.color,
      spent: parseFloat(r.spent),
    })),
    budgets: budgets.rows.map((b) => ({
      id: b.id,
      categoryId: b.category_id,
      categoryName: b.category_name,
      categoryEmoji: b.category_emoji,
      amount: parseFloat(b.amount),
      spent: parseFloat(b.spent || 0),
      percentageUsed: parseFloat(b.pct || 0),
      isOverall: b.is_overall,
    })),
    recentTransactions: recentTx.rows.map((t) => ({
      id: t.id,
      amount: parseFloat(t.amount),
      type: t.type,
      categoryName: t.category_name,
      categoryEmoji: t.category_emoji,
      merchantName: t.merchant_name,
      date: t.transaction_date,
      description: t.description,
    })),
    monthlyTrend: last6Months.rows.map((r) => ({
      month: r.month,
      expenses: parseFloat(r.expenses),
      income: parseFloat(r.income),
    })),
    goals: goals.rows.map((g) => ({
      id: g.id,
      title: g.title,
      targetAmount: parseFloat(g.target_amount),
      currentAmount: parseFloat(g.current_amount),
      percentage: Math.round((parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100),
      targetDate: g.target_date,
      status: g.status,
    })),
    insights: insights.rows.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      body: i.body,
      createdAt: i.created_at,
    })),
  });
}

module.exports = { getDashboard };
