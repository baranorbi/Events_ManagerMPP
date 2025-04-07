import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Replace with your API base URL
  timeout: 60000, // Timeout in milliseconds
});

export default api;