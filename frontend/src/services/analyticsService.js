import api from './api';

const PERIOD_TO_MONTHS = { '3M': 3, '6M': 6, '1Y': 12, 'All': 24 };

export const analyticsService = {
  getSpendingPatterns: (period = '6M') => {
    const months = PERIOD_TO_MONTHS[period] || 6;
    return api.get('/analytics/spending-patterns', { params: { months } }).then((r) => r.data);
  },

  getCategoryTrends: (params = {}) =>
    api.get('/analytics/category-trends', { params }).then((r) => r.data),
};
