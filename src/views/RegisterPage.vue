<template>
  <div class="min-h-screen bg-[#161616] flex items-center justify-center p-4">
    <div class="bg-[#232323] rounded-lg w-full max-w-md border border-[#737373] shadow-lg">
      <div class="p-8">
        <div class="flex items-center justify-center mb-8">
          <Layers class="w-10 h-10 text-[#533673]" />
          <h1 class="text-2xl font-bold text-[#D9D9D9] ml-3">Events Manager</h1>
        </div>
        
        <h2 class="text-xl font-semibold mb-6 text-center text-[#D9D9D9]">Create Account</h2>
        
        <div v-if="error" class="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-300 rounded-md text-sm text-center">
          {{ error }}
        </div>
        
        <form @submit.prevent="handleRegister">
          <div class="mb-4">
            <label for="name" class="block text-sm text-[#737373] mb-1">Full Name</label>
            <div class="relative">
              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="Enter your name"
                class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                required
              />
              <User class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="20" />
            </div>
          </div>
          
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
          
          <div class="mb-4">
            <label for="description" class="block text-sm text-[#737373] mb-1">Brief Description</label>
            <textarea
              id="description"
              v-model="description"
              placeholder="Tell us a bit about yourself"
              class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div class="mb-6">
            <label for="password" class="block text-sm text-[#737373] mb-1">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Choose a password"
                class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                required
                minlength="6"
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
            class="w-full py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
            :disabled="loading"
          >
            <span v-if="!loading">Create Account</span>
            <span v-else>Creating account...</span>
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-[#737373] text-sm">
            Already have an account? 
            <router-link to="/sign-in" class="text-[#533673] hover:underline">Sign In</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Layers, Mail, Eye, EyeOff, User } from 'lucide-vue-next';
import { useAuthStore } from '../store/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form state
const name = ref('');
const description = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const success = await authStore.register({
      name: name.value,
      description: description.value,
      email: email.value,
      password: password.value
    });
    
    if (success) {
      router.push('/');
    } else {
      error.value = 'Failed to create account. Please try again.';
    }
  } catch (err: any) {
    if (err.response && err.response.data) {
      if (err.response.data.email) {
        error.value = err.response.data.email[0];
      } else {
        error.value = 'An error occurred during registration';
      }
    } else {
      error.value = 'An error occurred during registration';
    }
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>