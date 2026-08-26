import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('@Houzen:user');
  if (!stored) return config;
  try {
    const user = JSON.parse(stored);
    if (user.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch {
    localStorage.removeItem('@Houzen:user');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code;
    if (error.response?.status === 401 || code === 'ACCOUNT_SUSPENDED') {
      window.dispatchEvent(new CustomEvent('houzen:auth-error', {
        detail: {
          code,
          message: error.response?.data?.error || error.response?.data?.message
        }
      }));
    }
    return Promise.reject(error);
  }
);

export function getApiError(error, fallback = 'Não foi possível concluir a operação.') {
  return error.response?.data?.error || error.response?.data?.message || fallback;
}

export default api;
