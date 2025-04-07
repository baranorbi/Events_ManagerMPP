<template>
  <div class="relative">
    <!-- Status indicator button -->
    <button 
      class="flex items-center justify-center ml-2 w-9 h-9 rounded-full transition-colors"
      :class="statusClass"
      @click="toggleDetails"
      :title="statusTooltip"
    >
      <WifiOff v-if="connectionStatus === 'offline'" :size="18" />
      <ServerCrash v-else-if="connectionStatus === 'server-down'" :size="18" />
      <Wifi v-else :size="18" />
    </button>
    
    <!-- Dropdown with details -->
    <div 
      v-if="showDetails" 
      class="absolute right-0 mt-2 w-80 bg-[#232323] rounded-md shadow-lg border border-[#737373] z-50"
    >
      <div class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[#D9D9D9] font-semibold">Connection Status</h3>
          <button @click="toggleDetails" class="text-[#737373] hover:text-[#D9D9D9]">
            <X :size="16" />
          </button>
        </div>
        
        <div class="space-y-3">
          <!-- Network connection status -->
          <div class="flex items-center">
            <div 
              class="w-3 h-3 rounded-full mr-2" 
              :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span class="text-[#D9D9D9]">
              Network: {{ isOnline ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          
          <!-- Server status -->
          <div class="flex items-center">
            <div 
              class="w-3 h-3 rounded-full mr-2" 
              :class="isServerReachable ? 'bg-green-500' : 'bg-amber-500'"
            ></div>
            <span class="text-[#D9D9D9]">
              Server: {{ isServerReachable ? 'Online' : 'Unreachable' }}
            </span>
          </div>
          
          <!-- Pending operations info -->
          <div v-if="pendingCount > 0" class="mt-3 text-[#D9D9D9]">
            <div class="flex items-center">
              <Clock :size="14" class="mr-2" />
              <span>{{ pendingCount }} operation{{ pendingCount !== 1 ? 's' : '' }} pending sync</span>
            </div>
            
            <button 
              v-if="connectionStatus === 'online'" 
              @click="syncNow"
              class="mt-2 w-full py-2 text-sm bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
              :disabled="isSyncing"
            >
              <span v-if="!isSyncing">Sync Now</span>
              <span v-else>Syncing... ({{ syncProgress }}%)</span>
            </button>
          </div>
          
          <!-- Last checked info -->
          <div class="text-xs text-[#737373] mt-2">
            Last checked: {{ formatTime(lastChecked) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { WifiOff, Wifi, ServerCrash, X, Clock } from 'lucide-vue-next';
import { useOfflineStore } from '../store/offlineStore';

const showDetails = ref(false);

const {
  connectionStatus,
  isOnline,
  isServerReachable,
  lastChecked,
  pendingOperations,
  isSyncing,
  syncProgress,
  syncPendingOperations
} = useOfflineStore();

const pendingCount = computed(() => {
  return pendingOperations.value.filter(op => !op.synced).length;
});

const statusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'bg-red-500 bg-opacity-20 text-red-500 hover:bg-opacity-30';
    case 'server-down':
      return 'bg-amber-500 bg-opacity-20 text-amber-500 hover:bg-opacity-30';
    default:
      return pendingCount.value > 0 
        ? 'bg-blue-500 bg-opacity-20 text-blue-500 hover:bg-opacity-30' 
        : 'bg-green-500 bg-opacity-20 text-green-500 hover:bg-opacity-30';
  }
});

const statusTooltip = computed(() => {
  switch (connectionStatus.value) {
    case 'offline':
      return 'You are offline';
    case 'server-down':
      return 'Server is unreachable';
    default:
      return pendingCount.value > 0 
        ? `Online - ${pendingCount.value} pending operations` 
        : 'All systems operational';
  }
});

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const syncNow = () => {
  syncPendingOperations();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const closeOnOutsideClick = (event: MouseEvent) => {
  if (showDetails.value) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      showDetails.value = false;
    }
  }
};

document.addEventListener('click', closeOnOutsideClick);

onUnmounted(() => {
  document.removeEventListener('click', closeOnOutsideClick);
});
</script>