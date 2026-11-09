import axios from 'axios';

const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');
const apiBaseUrl = /\/api$/i.test(normalizedApiUrl) ? normalizedApiUrl : `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('noko-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Unable to reach the server. Please try again.';
}

export default api;
