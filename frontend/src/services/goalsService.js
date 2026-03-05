import api from './api';

export const goalsService = {
  getAll: () => api.get('/goals').then((r) => r.data),

  create: (data) => api.post('/goals', data).then((r) => r.data),

  update: (id, data) => api.put(`/goals/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/goals/${id}`).then((r) => r.data),

  contribute: (id, newCurrentAmount) =>
    api.put(`/goals/${id}`, { currentAmount: newCurrentAmount }).then((r) => r.data),
};
