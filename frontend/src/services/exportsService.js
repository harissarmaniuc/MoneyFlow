import api from './api';

export const exportsService = {
  exportData: (format, filters = {}) =>
    api.post(`/exports/${format}`, filters).then((r) => r.data),

  checkStatus: (id) => api.get(`/exports/${id}/download`).then((r) => r.data),
};
