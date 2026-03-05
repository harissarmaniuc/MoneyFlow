import api from './api';

export const subscriptionsService = {
  getAll: () => api.get('/subscriptions').then((r) => r.data),

  create: (data) => api.post('/subscriptions', data).then((r) => r.data),

  update: (id, data) => api.put(`/subscriptions/${id}`, data).then((r) => r.data),

  delete: (id) => api.delete(`/subscriptions/${id}`).then((r) => r.data),
};
