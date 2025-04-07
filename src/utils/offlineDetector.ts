import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../store/api';

export const useNetworkStatus = () => {
  const isOnline = ref(navigator.onLine);
  const isServerReachable = ref(true);
  const lastChecked = ref(new Date());
  const isCheckingServer = ref(false);
  const checkInterval = ref(30000);

  const connectionStatus = computed(() => {
    if (!isOnline.value) return 'offline'; // Device is offline
    if (!isServerReachable.value) return 'server-down'; // Server is unreachable
    return 'online'; // Everything is working
  });

  const checkServerStatus = async () => {
    if (!isOnline.value || isCheckingServer.value) return;
    
    isCheckingServer.value = true;
    try {
      const response = await api.head('/', { timeout: 5000 });
      isServerReachable.value = response.status >= 200 && response.status < 400;
    } catch (error) {
      console.warn('Server status check failed:', error);
      isServerReachable.value = false;
    } finally {
      lastChecked.value = new Date();
      isCheckingServer.value = false;
    }
  };

  const handleOnlineStatusChange = () => {
    isOnline.value = navigator.onLine;
    
    if (isOnline.value) {
      checkServerStatus();
    }
  };

  let serverCheckInterval: number | null = null;

  onMounted(() => {
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    checkServerStatus();
    
    serverCheckInterval = window.setInterval(checkServerStatus, checkInterval.value);
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnlineStatusChange);
    window.removeEventListener('offline', handleOnlineStatusChange);
    
    if (serverCheckInterval !== null) {
      window.clearInterval(serverCheckInterval);
    }
  });

  return {
    isOnline,
    isServerReachable,
    connectionStatus,
    lastChecked,
    checkServerStatus,
  };
};