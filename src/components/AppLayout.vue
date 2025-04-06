<template>
  <div class="min-h-screen bg-[#161616] text-[#FFFFFF] flex flex-col">
    <!-- Header -->
    <header class="flex items-center h-16 px-4 bg-[#232323] border-b border-[#737373] shrink-0 md:px-6">
      <div class="flex items-center gap-2 text-lg font-semibold sm:text-base mr-4">
        <Layers class="w-6 h-6 text-[#533673]" />
        <span>Events Manager</span>
      </div>
      
      <!-- Search Bar -->
      <div class="flex-1 flex justify-center">
        <div class="relative w-full max-w-md">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="18" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search Event" 
            class="w-full bg-[#232323] border border-[#737373] rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#533673]"
            @input="handleSearch"
          />
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]"
          >
            <X :size="18" />
          </button>
        </div>
      </div>
      
      <!-- Shuffle Button -->
      <button 
        @click="openRandomEvent"
        class="ml-4 p-2 rounded-md bg-[#232323] border border-[#737373] hover:bg-[#333333] transition-colors"
        title="Open random event"
        :disabled="isLoadingRandom"
      >
        <Shuffle v-if="!isLoadingRandom" :size="18" class="text-[#D9D9D9]" />
        <div v-else class="w-[18px] h-[18px] border-2 border-t-transparent border-[#D9D9D9] rounded-full animate-spin"></div>
      </button>
      
      <!-- Auth Button -->
      <button 
        @click="toggleAuth"
        class="ml-4 px-4 py-2 rounded-md border border-[#533673] text-[#D9D9D9] hover:bg-[#533673] hover:bg-opacity-20 transition-colors"
      >
        {{ isAuthenticated ? 'Sign Out' : 'Sign In' }}
      </button>
    </header>
    
    <!-- Sidebar and Content Container -->
    <div class="flex flex-1">
      <!-- Sidebar -->
      <aside class="w-20 bg-[#1A1A1A] flex flex-col items-center py-6 border-r border-[#282828]">
        <!-- Home -->
        <router-link 
          to="/" 
          class="sidebar-item mb-8"
          :class="{ 'active': currentRoute === '/' }"
        >
          <div class="icon-container">
            <Home :size="20" class="text-[#D9D9D9]" />
          </div>
          <span class="text-xs mt-2 text-[#D9D9D9]">Home</span>
        </router-link>
        
        <!-- Trending -->
        <router-link 
          to="/trending" 
          class="sidebar-item mb-8"
          :class="{ 'active': currentRoute === '/trending' }"
        >
          <div class="icon-container">
            <Zap :size="20" class="text-[#D9D9D9]" />
          </div>
          <span class="text-xs mt-2 text-[#D9D9D9]">Trending</span>
        </router-link>
        <!-- Charts -->
        <router-link 
          to="/charts" 
          class="sidebar-item mb-8"
          :class="{ 'active': currentRoute === '/charts' }"
        >
          <div class="icon-container">
            <BarChart2 :size="20" class="text-[#D9D9D9]" />
          </div>
          <span class="text-xs mt-2 text-[#D9D9D9]">Charts</span>
        </router-link>
        
        <!-- Profile -->
        <router-link 
          to="/profile" 
          class="sidebar-item mb-8"
          :class="{ 'active': currentRoute === '/profile' }"
        >
          <div class="icon-container">
            <User :size="20" class="text-[#D9D9D9]" />
          </div>
          <span class="text-xs mt-2 text-[#D9D9D9]">Profile</span>
        </router-link>
      </aside>
      
      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-auto">
        <slot></slot>
      </main>
    </div>
    
    <!-- Event Details Modal for Random Event -->
    <EventDetailsModal
      v-if="showRandomEventModal"
      :event-id="randomEventId"
      @close="showRandomEventModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Layers, Search, X, Home, Zap, User, Shuffle, BarChart2 } from 'lucide-vue-next';
import { useEventStore } from '../store/events';
import { useAuthStore } from '../store/auth';
import EventDetailsModal from './EventDetailsModal.vue';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const showRandomEventModal = ref(false);
const randomEventId = ref('');
const isLoadingRandom = ref(false);

const isAuthenticated = computed(() => authStore.checkAuth());

const currentRoute = computed(() => {
  return route.path;
});

const toggleAuth = () => {
  if (isAuthenticated.value) {
    authStore.signOut();
    router.push('/');
  } else {
    router.push('/sign-in');
  }
};

const handleSearch = () => {
  // Navigate to home page with search query if not already there
  if (route.path !== '/') {
    router.push({
      path: '/',
      query: { search: searchQuery.value }
    });
  }
  
  // Always emit the search event for the current page to handle
  emit('search', searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = '';
  
  // Navigate to home page without search query if not already there
  if (route.path !== '/') {
    router.push('/');
  }
  
  // Always emit the empty search event
  emit('search', '');
};

const openRandomEvent = async () => {
  isLoadingRandom.value = true;
  try {
    const randomEvent = await eventStore.getRandomEvent();
    if (randomEvent) {
      randomEventId.value = randomEvent.id;
      showRandomEventModal.value = true;
    }
  } catch (err) {
    console.error('Failed to get random event:', err);
  } finally {
    isLoadingRandom.value = false;
  }
};

const emit = defineEmits(['search']);
</script>

<style scoped>
.sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  transition: all 0.2s ease;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #232323;
  transition: all 0.2s ease;
}

.sidebar-item.active .icon-container {
  background-color: #533673; 
  box-shadow: 0 0 0 2px rgba(83, 54, 115, 0.3);
}

.sidebar-item.active span {
  color: #FFFFFF;
}

.sidebar-item.active svg {
  color: #FFFFFF;
}

.sidebar-item:hover:not(.active) .icon-container {
  background-color: #333333;
  transform: translateY(-2px);
}

.sidebar-item:hover:not(.active) span {
  color: #FFFFFF;
}

.sidebar-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background-color: #533673;
  border-radius: 0 2px 2px 0;
}
</style>