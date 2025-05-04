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
  if (savedAuth) {
    const parsedAuth = JSON.parse(savedAuth);
    currentUser.value = parsedAuth.user;
    isAuthenticated.value = true;
  }
} catch (error) {
  console.error('Error loading auth state:', error);
}

export function useAuthStore() {
  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/', { email, password });
      
      const user = response.data;
      
      if (user) {
        currentUser.value = user;
        isAuthenticated.value = true;
        
        localStorage.setItem('auth', JSON.stringify({
          user
        }));
        
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
      
      const user = response.data;
      
      if (user) {
        currentUser.value = user;
        isAuthenticated.value = true;
        
        localStorage.setItem('auth', JSON.stringify({
          user
        }));
        
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
  
  return {
    signIn,
    register,
    signOut,
    checkAuth,
    getUser,
    isAdmin
  };
}