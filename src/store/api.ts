import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.40.169:8000/api',
  timeout: 60000,
});

export default api;