import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://eventverse-backend-8ue1.onrender.com';
const backendBaseUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');
const api = axios.create({
  baseURL: `${backendBaseUrl}/api/v1`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.baseURL && config.baseURL.endsWith('/') && config.url?.startsWith('/')) {
      config.url = config.url.replace(/^\/+/g, '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
