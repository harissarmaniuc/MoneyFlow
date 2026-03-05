const { query } = require('../config/db');

const formatUser = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  preferredMode: row.preferred_mode,
  userTypes: row.user_types,
  accessibilitySettings: row.accessibility_settings,
  language: row.language,
  monthlyBudget: row.monthly_budget,
  createdAt: row.created_at,
});

// GET /users/profile
const getProfile = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /users/profile
const updateProfile = async (req, res) => {
  const { fullName, language } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;

  if (fullName?.trim()) { fields.push(`full_name = $${idx++}`); values.push(fullName.trim()); }
  if (language) { fields.push(`language = $${idx++}`); values.push(language); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.user.userId);
  try {
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(formatUser(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// PUT /users/settings/mode
const updateMode = async (req, res) => {
  const { mode } = req.body;
  if (!['simple', 'detailed'].includes(mode)) {
    return res.status(400).json({ error: 'Mode must be "simple" or "detailed"' });
  }
  try {
    await query('UPDATE users SET preferred_mode = $1 WHERE id = $2', [mode, req.user.userId]);
    res.json({ preferredMode: mode });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mode' });
  }
};

// PUT /users/settings/user-types
const updateUserTypes = async (req, res) => {
  const { userTypes } = req.body;
  if (!Array.isArray(userTypes)) return res.status(400).json({ error: 'userTypes must be an array' });

  try {
    await query('UPDATE users SET user_types = $1 WHERE id = $2', [JSON.stringify(userTypes), req.user.userId]);
    res.json({ userTypes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user types' });
  }
};

// PUT /users/settings/accessibility
const updateAccessibility = async (req, res) => {
  const { accessibilitySettings } = req.body;
  if (!accessibilitySettings || typeof accessibilitySettings !== 'object') {
    return res.status(400).json({ error: 'accessibilitySettings object required' });
  }

  try {
    // Merge with existing settings
    const existing = await query('SELECT accessibility_settings FROM users WHERE id = $1', [req.user.userId]);
    const merged = { ...(existing.rows[0]?.accessibility_settings || {}), ...accessibilitySettings };

    await query('UPDATE users SET accessibility_settings = $1 WHERE id = $2', [JSON.stringify(merged), req.user.userId]);
    res.json({ accessibilitySettings: merged });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update accessibility settings' });
  }
};

module.exports = { getProfile, updateProfile, updateMode, updateUserTypes, updateAccessibility };
