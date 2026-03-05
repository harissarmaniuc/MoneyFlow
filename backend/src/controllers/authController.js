const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const SALT_ROUNDS = 10;

const generateAccessToken = (userId, email) =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

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

// POST /auth/signup
const signup = async (req, res) => {
  const {
    fullName, email, password,
    preferredMode = 'simple',
    userTypes = [],
    language = 'en',
    monthlyBudget = null,
    accessibilitySettings = {},
  } = req.body;

  // Basic validation
  if (!fullName?.trim()) return res.status(400).json({ error: 'Full name is required' });
  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!['simple', 'detailed'].includes(preferredMode)) return res.status(400).json({ error: 'Invalid mode' });

  try {
    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const refreshToken = generateRefreshToken('temp'); // placeholder
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const defaultAccessibility = {
      fontSize: 14, darkMode: false, highContrast: false,
      screenReader: false, voiceInput: false,
      ...accessibilitySettings,
    };

    const { rows } = await query(
      `INSERT INTO users
         (full_name, email, password_hash, preferred_mode, user_types, language, monthly_budget, accessibility_settings, refresh_token, refresh_token_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        fullName.trim(),
        email.toLowerCase(),
        passwordHash,
        preferredMode,
        JSON.stringify(userTypes),
        language,
        monthlyBudget || null,
        JSON.stringify(defaultAccessibility),
        null, // refresh token set after we have the real userId
        refreshExpires,
      ]
    );

    const user = rows[0];
    const accessToken = generateAccessToken(user.id, user.email);
    const realRefreshToken = generateRefreshToken(user.id);

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [realRefreshToken, user.id]);

    // Create a default monthly budget if provided
    if (monthlyBudget && parseFloat(monthlyBudget) > 0) {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      await query(
        `INSERT INTO budgets (user_id, amount, period, month, is_overall)
         VALUES ($1, $2, 'monthly', $3, true)
         ON CONFLICT DO NOTHING`,
        [user.id, parseFloat(monthlyBudget), thisMonth.toISOString().slice(0, 10)]
      );
    }

    res.status(201).json({
      token: accessToken,
      refreshToken: realRefreshToken,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// POST /auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
      [refreshToken, refreshExpires, user.id]
    );

    res.json({
      token: accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// POST /auth/logout
const logout = async (req, res) => {
  try {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.userId]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// POST /auth/refresh-token
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { rows } = await query(
      'SELECT id, email, refresh_token, refresh_token_expires FROM users WHERE id = $1 AND is_active = true',
      [payload.userId]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = rows[0];
    if (user.refresh_token !== token) return res.status(401).json({ error: 'Refresh token mismatch' });
    if (user.refresh_token_expires < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await query(
      'UPDATE users SET refresh_token = $1, refresh_token_expires = $2 WHERE id = $3',
      [newRefreshToken, refreshExpires, user.id]
    );

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

module.exports = { signup, login, logout, refreshToken };
