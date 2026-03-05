const { query } = require('../config/db');

const formatCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  emoji: row.emoji,
  color: row.color,
  isDefault: row.is_default,
  isIncome: row.is_income,
  sortOrder: row.sort_order,
  subcategories: row.subcategories || [],
});

// GET /categories  — returns system defaults + user's custom categories
const getCategories = async (req, res) => {
  const { type } = req.query; // 'expense' | 'income' | omit for all

  let whereClause = '(c.user_id IS NULL OR c.user_id = $1)';
  const values = [req.user.userId];

  if (type === 'income') whereClause += ' AND c.is_income = true';
  if (type === 'expense') whereClause += ' AND c.is_income = false';

  try {
    const { rows } = await query(
      `SELECT
         c.*,
         COALESCE(
           json_agg(
             json_build_object('id', s.id, 'name', s.name, 'emoji', s.emoji)
             ORDER BY s.name
           ) FILTER (WHERE s.id IS NOT NULL),
           '[]'
         ) AS subcategories
       FROM categories c
       LEFT JOIN subcategories s ON s.category_id = c.id AND (s.user_id IS NULL OR s.user_id = $1)
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`,
      values
    );
    res.json(rows.map(formatCategory));
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// POST /categories — create a custom category
const createCategory = async (req, res) => {
  const { name, emoji = '📌', color = '#9CA3AF', isIncome = false } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Category name required' });

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  try {
    const { rows } = await query(
      `INSERT INTO categories (user_id, name, slug, emoji, color, is_default, is_income)
       VALUES ($1, $2, $3, $4, $5, false, $6) RETURNING *`,
      [req.user.userId, name.trim(), slug, emoji, color, isIncome]
    );
    res.status(201).json(formatCategory(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// GET /subcategories/:categoryId
const getSubcategories = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM subcategories
       WHERE category_id = $1 AND (user_id IS NULL OR user_id = $2)
       ORDER BY name`,
      [req.params.categoryId, req.user.userId]
    );
    res.json(rows.map((r) => ({ id: r.id, name: r.name, emoji: r.emoji, isDefault: r.is_default })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

module.exports = { getCategories, createCategory, getSubcategories };
