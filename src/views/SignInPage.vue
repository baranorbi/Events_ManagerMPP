<template>
  <div class="min-h-screen bg-[#161616] flex items-center justify-center p-4">
    <div class="bg-[#232323] rounded-lg w-full max-w-md border border-[#737373] shadow-lg">
      <div class="p-8">
        <div class="flex items-center justify-center mb-8">
          <Layers class="w-10 h-10 text-[#533673]" />
          <h1 class="text-2xl font-bold text-[#D9D9D9] ml-3">Events Manager</h1>
        </div>
        
        <h2 class="text-xl font-semibold mb-6 text-center text-[#D9D9D9]">Sign In</h2>
        
        <div v-if="error" class="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-300 rounded-md text-sm text-center">
          {{ error }}
        </div>
        
        <form @submit.prevent="handleSignIn">
          <div class="mb-4">
            <label for="email" class="block text-sm text-[#737373] mb-1">Email</label>
            <div class="relative">
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="Enter your email"
                class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                required
              />
              <Mail class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="20" />
            </div>
          </div>
          
          <div class="mb-6">
            <label for="password" class="block text-sm text-[#737373] mb-1">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                required
              />
              <button 
                type="button"
                @click="togglePassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]"
              >
                <Eye v-if="showPassword" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>
            <div class="text-right mt-1">
              <a href="#" class="text-sm text-[#533673] hover:underline">Forgot password?</a>
            </div>
          </div>
          
          <button 
            type="submit"
            class="w-full py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
            :disabled="loading"
          >
            <span v-if="!loading">Sign In</span>
            <span v-else>Signing in...</span>
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-[#737373] text-sm">
            Demo credentials: john@example.com / password123
          </p>
        </div>
        <div class="mt-6 text-center">
          <p class="text-[#737373] text-sm">
            Don't have an account? 
            <router-link to="/register" class="text-[#533673] hover:underline">Create Account</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Layers, Mail, Eye, EyeOff } from 'lucide-vue-next';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form state
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleSignIn = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const success = await authStore.signIn(email.value, password.value);
    
    if (success) {
      // redirect to home page or previous page
      router.push('/');
    } else {
      error.value = 'Invalid email or password';
    }
  } catch (err) {
    error.value = 'An error occurred during sign in';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>