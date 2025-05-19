import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? '/api'  // Use relative path in production
    : 'http://127.0.0.1:8000/api',
  timeout: 60000,
});

export default api;