<template>
  <div class="two-factor-setup">
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchSetupInfo" class="retry-button">Retry</button>
    </div>
    
    <div v-else-if="!is2faEnabled" class="setup-container">
      <h2 class="text-2xl font-bold mb-4">Set Up Two-Factor Authentication</h2>
      
      <div class="steps">
        <div class="step mb-6">
          <h3 class="text-lg font-semibold mb-2">1. Scan QR Code</h3>
          <p class="mb-4 text-gray-300">Use your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator) to scan this QR code:</p>
          
          <div class="qr-code-container">
            <img v-if="qrCode" :src="`data:image/png;base64,${qrCode}`" alt="QR Code" class="qr-code">
          </div>
        </div>
        
        <div class="step mb-6">
          <h3 class="text-lg font-semibold mb-2">2. Enter Verification Code</h3>
          <p class="mb-4 text-gray-300">Enter the 6-digit code from your authenticator app:</p>
          
          <div class="otp-input-container mb-4">
            <vue3-otp-input
              ref="otpInput"
              :length="6"
              :input-type="'number'"
              @on-change="handleChange"
              @finish="handleComplete"
            />
          </div>
          
          <div v-if="verificationError" class="error-message mb-4">{{ verificationError }}</div>
          
          <button 
            @click="verifyAndEnable" 
            class="verify-button w-full py-2 px-4 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
            :disabled="verifying || !isComplete"
          >
            <span v-if="verifying">Verifying...</span>
            <span v-else>Verify and Enable 2FA</span>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="manage-container">
      <h2 class="text-2xl font-bold mb-4">Two-Factor Authentication is Enabled</h2>
      <p class="mb-6 text-gray-300">Your account is protected with two-factor authentication.</p>
      
      <button 
        @click="disable2FA" 
        class="disable-button w-full py-2 px-4 bg-red-600 rounded-md text-white hover:bg-red-700 transition-colors"
        :disabled="disabling"
      >
        <span v-if="disabling">Disabling...</span>
        <span v-else>Disable 2FA</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Vue3OtpInput from 'vue3-otp-input';
import { twoFactorService } from '../services/twoFactorService';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const qrCode = ref('');
const is2faEnabled = ref(false);
const loading = ref(true);
const error = ref('');
const verificationError = ref('');
const otpInput = ref<any>(null);
const otp = ref('');
const isComplete = ref(false);
const verifying = ref(false);
const disabling = ref(false);

const fetchSetupInfo = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await twoFactorService.getSetupInfo();
    qrCode.value = response.qr_code;
    is2faEnabled.value = response.is_enabled;
  } catch (err) {
    error.value = 'Failed to load 2FA setup information';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleComplete = (value: string) => {
  otp.value = value;
  isComplete.value = true;
};

const handleChange = (value: string) => {
  otp.value = value;
  isComplete.value = value.length === 6;
  verificationError.value = '';
};

const verifyAndEnable = async () => {
  if (!isComplete.value) return;
  
  verifying.value = true;
  verificationError.value = '';
  
  try {
    const userId = authStore.getUser()?.id || '';
    if (!userId) {
      verificationError.value = 'User information not available';
      return;
    }
    
    const result = await twoFactorService.verifyToken(userId, otp.value);
    
    if (result) {
      is2faEnabled.value = true;
      // Reset the form
      if (otpInput.value) {
        otpInput.value.clearInput();
      }
      isComplete.value = false;
    } else {
      verificationError.value = 'Invalid verification code';
    }
  } catch (err) {
    verificationError.value = 'Failed to verify code';
    console.error(err);
  } finally {
    verifying.value = false;
  }
};

const disable2FA = async () => {
  if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
    return;
  }
  
  disabling.value = true;
  
  try {
    await twoFactorService.disable();
    is2faEnabled.value = false;
  } catch (err) {
    error.value = 'Failed to disable 2FA';
    console.error(err);
  } finally {
    disabling.value = false;
  }
};

onMounted(() => {
  fetchSetupInfo();
});
</script>

<style scoped>
.two-factor-setup {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #232323;
  border-radius: 8px;
  border: 1px solid #444;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #533673;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.qr-code {
  width: 200px;
  height: 200px;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
}

.otp-input-container {
  display: flex;
  justify-content: center;
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

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #533673;
  color: white;
  border-radius: 4px;
}
</style>