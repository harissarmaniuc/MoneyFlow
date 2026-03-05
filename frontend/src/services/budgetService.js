import api from './api';

export const budgetService = {
  create: (data) => api.post('/budgets', data).then((r) => r.data),

  getAll: (month) => api.get('/budgets', { params: month ? { month } : {} }).then((r) => r.data),

  update: (id, data) => api.put(`/budgets/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/budgets/${id}`).then((r) => r.data),

  getProgress: (id) => api.get(`/budgets/${id}/progress`).then((r) => r.data),
};
