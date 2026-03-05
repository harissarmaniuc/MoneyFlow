import api from './api';

export const transactionService = {
  create: (data) => api.post('/transactions', data).then((r) => r.data),

  getAll: (params = {}) => api.get('/transactions', { params }).then((r) => r.data),

  getRecurring: () => api.get('/transactions/recurring').then((r) => r.data),

  update: (id, data) => api.put(`/transactions/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
