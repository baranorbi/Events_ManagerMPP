import { ref } from 'vue';
import api from './api';
import { twoFactorService } from '../services/twoFactorService';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Auth state
const currentUser = ref<User | null>(null);
const isAuthenticated = ref(false);
const pendingTwoFactorAuth = ref<string | null>(null);

// Initialize auth state from localStorage
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
      const data = response.data;
      
      // Check if 2FA is required
      if (data.requires_2fa) {
        // Store user ID for 2FA verification
        pendingTwoFactorAuth.value = data.user_id;
        return { requires2FA: true, userId: data.user_id };
      }
      
      // Standard authentication without 2FA
      const { user, tokens } = data;
      
      if (user && tokens) {
        currentUser.value = user;
        isAuthenticated.value = true;
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('auth', JSON.stringify({ user }));
        
        return { success: true };
      }
      
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };
  
  // Add method for 2FA verification
  const verifyTwoFactor = async (token: string) => {
    if (!pendingTwoFactorAuth.value) {
      return { success: false, error: 'No pending 2FA authentication' };
    }
    
    try {
      const data = await twoFactorService.verifyToken(pendingTwoFactorAuth.value, token);
      
      // Reset pending 2FA state
      pendingTwoFactorAuth.value = null;
      
      // Process login data
      const { user, tokens } = data;
      
      if (user && tokens) {
        currentUser.value = user;
        isAuthenticated.value = true;
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        localStorage.setItem('auth', JSON.stringify({ user }));
        
        return { success: true };
      }
      
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, error: 'Invalid verification code' };
    }
  };
  
  // Method to check if there's a pending 2FA verification
  const hasPendingTwoFactor = () => {
    return pendingTwoFactorAuth.value !== null;
  };
  
  // Existing auth store methods
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
    pendingTwoFactorAuth.value = null;
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
    checkTokenValidity,
    // 2FA methods
    verifyTwoFactor,
    hasPendingTwoFactor
  };
}