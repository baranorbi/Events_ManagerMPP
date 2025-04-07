import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../store/api';

export const useNetworkStatus = () => {
  // Network connection status
  const isOnline = ref(navigator.onLine);
  // API server status
  const isServerReachable = ref(true);
  // Last check timestamp
  const lastChecked = ref(new Date());
  // Are we currently checking server status
  const isCheckingServer = ref(false);
  // Checking interval in ms (default: 30 seconds)
  const checkInterval = ref(30000);

  // Combined status for convenience
  const connectionStatus = computed(() => {
    if (!isOnline.value) return 'offline'; // Device is offline
    if (!isServerReachable.value) return 'server-down'; // Server is unreachable
    return 'online'; // Everything is working
  });

  // Check if the server is reachable by making a lightweight request
  const checkServerStatus = async () => {
    if (!isOnline.value || isCheckingServer.value) return;
    
    isCheckingServer.value = true;
    try {
      // Make a HEAD request to minimize data transfer
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

  // Update online status when browser reports changes
  const handleOnlineStatusChange = () => {
    isOnline.value = navigator.onLine;
    
    // If we've come back online, check server immediately
    if (isOnline.value) {
      checkServerStatus();
    }
  };

  let serverCheckInterval: number | null = null;

  onMounted(() => {
    // Listen for network status changes
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Initial check
    checkServerStatus();
    
    // Set up regular interval for server checks
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