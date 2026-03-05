import api from './api';

export const categoryService = {
  getAll: (type) => api.get('/categories', { params: type ? { type } : {} }).then((r) => r.data),

  create: (data) => api.post('/categories', data).then((r) => r.data),

  getSubcategories: (categoryId) =>
    api.get(`/categories/subcategories/${categoryId}`).then((r) => r.data),
};
