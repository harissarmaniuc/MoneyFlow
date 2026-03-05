import api from './api';

export const insightsService = {
  getAll: () => api.get('/insights').then((r) => r.data),

  markRead: (id) => api.put(`/insights/${id}/mark-read`).then((r) => r.data),
};
