const { query } = require('../config/db');

// Attaches req.userMode = 'simple' | 'detailed'
// Reads from query param first, then user's DB preference
const modeMiddleware = async (req, res, next) => {
  const fromQuery = req.query.mode;
  if (fromQuery === 'simple' || fromQuery === 'detailed') {
    req.userMode = fromQuery;
    return next();
  }

  if (req.user?.userId) {
    try {
      const { rows } = await query(
        'SELECT preferred_mode FROM users WHERE id = $1',
        [req.user.userId]
      );
      req.userMode = rows[0]?.preferred_mode || 'simple';
    } catch {
      req.userMode = 'simple';
    }
  } else {
    req.userMode = 'simple';
  }

  next();
};

module.exports = modeMiddleware;
