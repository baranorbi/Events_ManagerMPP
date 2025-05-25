<template>
  <div class="two-factor-container">
    <h2 class="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
    <p class="mb-6 text-gray-300">Please enter the verification code from your authenticator app</p>
    
    <div class="otp-input-container mb-6">
      <vue3-otp-input
        ref="otpInput"
        :length="6"
        :input-type="'number'"
        @update:model-value="handleChange"
        @complete="handleComplete"
      />
    </div>
    
    <div v-if="error" class="error-message mb-4">{{ error }}</div>
    
    <button 
      @click="verifyCode" 
      class="verify-button w-full py-2 px-4 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors mb-4"
      :disabled="loading || !isComplete"
    >
      <span v-if="loading">Verifying...</span>
      <span v-else>Verify Code</span>
    </button>
    
    <div class="text-center mt-4">
      <button 
        @click="cancel" 
        class="text-sm text-blue-400 hover:underline"
      >
        Cancel and return to login
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import Vue3OtpInput from 'vue3-otp-input';

const router = useRouter();
const authStore = useAuthStore();

const otpInput = ref<any>(null);
const otp = ref('');
const loading = ref(false);
const error = ref('');
const isComplete = ref(false);

const handleComplete = (value: string) => {
  otp.value = value;
  isComplete.value = true;
};

const handleChange = (value: string) => {
  otp.value = value;
  isComplete.value = value.length === 6;
  error.value = '';
};

const verifyCode = async () => {
  if (!isComplete.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const result = await authStore.verifyTwoFactor(otp.value);
    
    if (result.success) {
      router.push('/'); // Redirect to home page after successful verification
    } else {
      error.value = result.error || 'Verification failed';
      // Reset OTP input on failure
      if (otpInput.value) {
        otpInput.value.reset();
      }
      isComplete.value = false;
    }
  } catch (err) {
    error.value = 'An error occurred during verification';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  // Clear pending 2FA state
  authStore.signOut();
  router.push('/sign-in');
};
</script>

<style scoped>
.two-factor-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #232323;
  border-radius: 8px;
  border: 1px solid #444;
}

.otp-input-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

:deep(.vue3-otp-input) {
  display: flex;
  justify-content: center;
  gap: 8px;
}

:deep(.vue3-otp-input input) {
  width: 40px !important;
  height: 50px;
  border-radius: 4px;
  border: 1px solid #444;
  background-color: #333;
  color: white;
  font-size: 1.25rem;
  text-align: center;
}

.error-message {
  color: #ef4444;
  text-align: center;
}
</style>