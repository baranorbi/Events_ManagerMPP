import axios from 'axios';

const CLOUDFRONT_DOMAIN = 'd1lre8oyraby8d.cloudfront.net';

const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? `https://${CLOUDFRONT_DOMAIN}/api`
    : 'http://127.0.0.1:8000/api',
  timeout: 60000,
});

export default api;