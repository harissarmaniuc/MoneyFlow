import api from './api';

export const dashboardService = {
  get: (mode, month) =>
    api.get('/dashboard', { params: { mode, ...(month ? { month } : {}) } }).then((r) => r.data),
};
