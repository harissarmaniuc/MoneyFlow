import api from './api';

export const groupExpensesService = {
  getAll: () => api.get('/group-expenses').then((r) => r.data),

  create: (data) => api.post('/group-expenses', data).then((r) => r.data),

  settle: (id) => api.post(`/group-expenses/${id}/settle`).then((r) => r.data),

  getCalculations: (id) => api.get(`/group-expenses/${id}/calculations`).then((r) => r.data),
};
