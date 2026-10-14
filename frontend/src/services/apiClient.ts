import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always transmit HttpOnly session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to handle FormData multipart boundaries automatically
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor to catch unauthorized API calls
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If we receive a 401 on an admin route, broadcast or notify
      const isAuthCheck = error.config?.url?.includes('/api/v1/admin/auth/me');
      if (!isAuthCheck && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
