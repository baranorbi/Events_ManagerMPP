import { ref } from 'vue';

const users = [
  {
    id: 'user1',
    email: 'john@example.com',
    password: 'password123',
    name: 'John Doe'
  }
];

interface User {
  id: string;
  email: string;
  name: string;
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
  const signIn = (email: string, password: string) => {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        name: user.name
      };
      
      currentUser.value = userWithoutPassword;
      isAuthenticated.value = true;
      
      localStorage.setItem('auth', JSON.stringify({
        user: userWithoutPassword
      }));
      
      return true;
    }
    
    return false;
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