<template>
  <div class="sign-in-container min-h-screen flex flex-col justify-center items-center px-4">
    <!-- Regular sign in form -->
    <div v-if="!showTwoFactor" class="w-full max-w-md p-8 space-y-8 bg-[#232323] rounded-lg shadow-lg">
      <div>
        <h2 class="text-3xl font-bold text-center text-[#D9D9D9]">Sign In</h2>
        <p class="mt-2 text-center text-[#737373]">Welcome back to Events Manager</p>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div v-if="error" class="p-3 rounded-md bg-red-900 bg-opacity-25 text-red-200 text-sm mb-4">
          {{ error }}
        </div>
        
        <div>
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
        
        <div>
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
        </div>
        
        <button 
          type="submit"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#533673] hover:bg-opacity-90 focus:outline-none transition-colors"
          :disabled="loading"
        >
          <Loader2 v-if="loading" class="animate-spin mr-2" :size="20" />
          Sign In
        </button>
        
        <div class="flex items-center justify-center">
          <div class="text-sm">
            <p class="text-[#737373]">
              Don't have an account? 
              <router-link to="/register" class="text-[#533673] hover:underline">
                Register
              </router-link>
            </p>
          </div>
        </div>
      </form>
    </div>
    
    <!-- Two-factor authentication component -->
    <TwoFactorAuth v-if="showTwoFactor" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Mail, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../store/auth';
import TwoFactorAuth from '../components/TwoFactorAuth.vue';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const showTwoFactor = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const result = await authStore.signIn(email.value, password.value);
    
    if (result.requires2FA) {
      // Show the 2FA verification component
      showTwoFactor.value = true;
    } else if (result.success) {
      // Redirect to home page on successful authentication
      router.push('/');
    } else {
      error.value = result.error || 'Invalid credentials';
    }
  } catch (err) {
    error.value = 'An error occurred during sign in';
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>