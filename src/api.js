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
  register: (username, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

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
