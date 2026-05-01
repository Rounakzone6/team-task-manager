import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll:       ()          => api.get('/projects'),
  getById:      (id)        => api.get(`/projects/${id}`),
  create:       (data)      => api.post('/projects', data),
  update:       (id, data)  => api.put(`/projects/${id}`, data),
  remove:       (id)        => api.delete(`/projects/${id}`),
  addMember:    (id, data)  => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId)=> api.delete(`/projects/${id}/members/${userId}`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:       (params)    => api.get('/tasks', { params }),
  getById:      (id)        => api.get(`/tasks/${id}`),
  create:       (data)      => api.post('/tasks', data),
  update:       (id, data)  => api.put(`/tasks/${id}`, data),
  remove:       (id)        => api.delete(`/tasks/${id}`),
  updateStatus: (id, status)=> api.patch(`/tasks/${id}/status`, { status }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  search:        (q)    => api.get('/users/search', { params: { q } }),
  updateProfile: (data) => api.put('/users/profile', data),
};
