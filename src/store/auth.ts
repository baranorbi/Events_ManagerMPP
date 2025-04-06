import { ref } from 'vue';
import api from './api';

interface User {
  id: string;
  email: string;
  name: string;
}

const currentUser = ref<User | null>(null);
const isAuthenticated = ref(false);

// Try to load auth state from localStorage for persistence between page refreshes
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
  
  return {
    signIn,
    signOut,
    checkAuth,
    getUser
  };
}