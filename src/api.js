const API_BASE = import.meta.env.VITE_API_URL || '';

const getToken = () => localStorage.getItem('farm_token');

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
};

export const api = {
  register: (username, password, fullName, orgName) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName, orgName }),
    }),

  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request('/api/auth/me'),

  getRecords: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.facility_id) params.set('facility_id', filters.facility_id);
    if (filters.year) params.set('year', filters.year);
    if (filters.quarter) params.set('quarter', filters.quarter);
    const qs = params.toString();
    return request(`/api/records${qs ? `?${qs}` : ''}`);
  },

  getRecord: (id) => request(`/api/records/${id}`),

  createRecord: (data) =>
    request('/api/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteRecord: (id) =>
    request(`/api/records/${id}`, { method: 'DELETE' }),

  uploadPhotos: async (files) => {
    const token = getToken();
    const formData = new FormData();
    files.forEach((file) => {
      const blob = dataURLtoBlob(file);
      const ext = file.startsWith('data:image/png') ? 'png' : 'jpg';
      formData.append('photos', blob, `photo_${Date.now()}.${ext}`);
    });

    const res = await fetch(`${API_BASE}/api/photos/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  getAnalyticsSummary: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    if (filters.quarter) params.set('quarter', filters.quarter);
    const qs = params.toString();
    return request(`/api/analytics/summary${qs ? `?${qs}` : ''}`);
  },

  getAnalyticsComparison: (params) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    return request(`/api/analytics/comparison?${sp.toString()}`);
  },

  getOrg: () => request('/api/admin/org'),

  updateOrg: (data) =>
    request('/api/admin/org', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getOrgUsers: () => request('/api/admin/org/users'),

  createUser: (data) =>
    request('/api/admin/org/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id, data) =>
    request(`/api/admin/org/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id) =>
    request(`/api/admin/org/users/${id}`, { method: 'DELETE' }),

  getTemplates: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    const qs = params.toString();
    return request(`/api/templates${qs ? `?${qs}` : ''}`);
  },

  getTemplate: (id) => request(`/api/templates/${id}`),

  createTemplate: (data) =>
    request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: (id, data) =>
    request(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  publishTemplate: (id) =>
    request(`/api/templates/${id}/publish`, { method: 'POST' }),

  deleteTemplate: (id) =>
    request(`/api/templates/${id}`, { method: 'DELETE' }),

  archiveTemplate: (id) =>
    request(`/api/templates/${id}/archive`, { method: 'POST' }),

  getAudits: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.template_id) params.set('template_id', filters.template_id);
    const qs = params.toString();
    return request(`/api/audits${qs ? `?${qs}` : ''}`);
  },

  getAudit: (id) => request(`/api/audits/${id}`),

  createAudit: (data) =>
    request('/api/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAuditResponses: (id, data) =>
    request(`/api/audits/${id}/responses`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  submitAudit: (id, responses) =>
    request(`/api/audits/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    }),

  deleteAudit: (id) =>
    request(`/api/audits/${id}`, { method: 'DELETE' }),

  getNCStats: () => request('/api/ncs/stats'),

  getNCs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);
    if (filters.audit_id) params.set('audit_id', filters.audit_id);
    const qs = params.toString();
    return request(`/api/ncs${qs ? `?${qs}` : ''}`);
  },

  getNC: (id) => request(`/api/ncs/${id}`),

  createNC: (data) =>
    request('/api/ncs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNC: (id, data) =>
    request(`/api/ncs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateNCStatus: (id, status, note) =>
    request(`/api/ncs/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    }),

  addNCTimeline: (id, action, note) =>
    request(`/api/ncs/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify({ action, note }),
    }),

  getDashboard: () => request('/api/dashboard'),

  getAnalyticsAudits: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    const qs = params.toString();
    return request(`/api/analytics/audits${qs ? `?${qs}` : ''}`);
  },

  getAnalyticsNCs: () => request('/api/analytics/ncs'),
};

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export default api;
