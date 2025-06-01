import axios from 'axios';

const getBaseURL = () => {
  // Check for build-time environment variables first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're running in GitHub Codespaces
  const hostname = window.location.hostname;
  
  if (hostname.includes('app.github.dev')) {
    // We're in Codespaces - extract the base and change port
    // From: refactored-orbit-6rgjx5ggp9rcrg7g-5173.app.github.dev
    // To:   refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev
    const protocol = window.location.protocol;
    const baseHost = hostname.replace('-5173.', '-8000.');
    return `${protocol}//${baseHost}/api`;
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  
  // Check if we're on GitHub Pages
  if (hostname.includes('github.io')) {
    // Use your actual Codespace URL for GitHub Pages
    return 'https://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev/api';
  }
  
  // Fallback: use current origin
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

console.log('API Base URL:', getBaseURL()); // Debug log

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          window.location.href = '/sign-in';
          return Promise.reject(error);
        }
        
        const response = await axios.post(
          `${api.defaults.baseURL}/token/refresh/`,
          { refresh: refreshToken }
        );
        
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth');
        window.location.href = '/sign-in';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;