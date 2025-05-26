import { ref } from 'vue';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const currentUser = ref<User | null>(null);
const isAuthenticated = ref(false);

try {
  const savedAuth = localStorage.getItem('auth');
  const accessToken = localStorage.getItem('access_token');
  
  if (savedAuth && accessToken) {
    const parsedAuth = JSON.parse(savedAuth);
    currentUser.value = parsedAuth.user;
    isAuthenticated.value = true;
  } else {
    // Clear potentially invalid tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth');
  }
} catch (error) {
  console.error('Error loading auth state:', error);
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth');
}

export function useAuthStore() {
  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/', { email, password });
      
      const { user, tokens } = response.data;
      
      if (user && tokens) {
        currentUser.value = user;
        isAuthenticated.value = true;
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('auth', JSON.stringify({ user }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const register = async (userData: {
    name: string;
    description: string;
    email: string;
    password: string;
    avatar?: string;
  }) => {
    try {
      const response = await api.post('/register/', userData);
      
      const { user, tokens } = response.data;
      
      if (user && tokens) {
        currentUser.value = user;
        isAuthenticated.value = true;
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('auth', JSON.stringify({ user }));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const signOut = () => {
    currentUser.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('auth');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };
  
  const checkAuth = () => {
    return isAuthenticated.value;
  };
  
  const getUser = () => {
    return currentUser.value;
  };

  const isAdmin = () => {
    return currentUser.value?.role === 'ADMIN';
  };
  
  // New method to check if token is valid
  const checkTokenValidity = async () => {
    try {
      // Make a request to a protected endpoint
      await api.get('/users/validate-token/');
      return true;
    } catch (error) {
      // If token is invalid and refresh fails, this will redirect to login
      return false;
    }
  };
  
  return {
    signIn,
    register,
    signOut,
    checkAuth,
    getUser,
    isAdmin,
    checkTokenValidity
  };
}