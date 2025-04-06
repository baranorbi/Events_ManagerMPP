<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-center mb-6">
        <Zap class="w-8 h-8 text-[#533673] mr-3" />
        <h1 class="text-4xl font-bold">Popular Event</h1>
      </div>
      
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
      </div>
      
      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500">{{ error }}</p>
        <button 
          @click="loadEvents" 
          class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
        >
          Try Again
        </button>
      </div>
      
      <div v-else-if="events.length === 0" class="text-center py-8">
        <p class="text-[#737373]">No events available</p>
      </div>
      
      <div v-else class="grid md:grid-cols-2 gap-8">
        <div>
          <h2 class="text-2xl font-semibold text-[#D9D9D9]">{{ currentEvent.title }}</h2>
          <p class="text-xl text-[#737373] mt-2">{{ formatDate(currentEvent.date) }}</p>
          
          <div class="mt-6">
            <h3 class="text-xl font-semibold text-[#D9D9D9]">Description</h3>
            <p class="text-[#737373] mt-2">
              {{ currentEvent.description }}
            </p>
          </div>
          
          <div class="flex gap-4 mt-8">
            <button 
              @click="previousEvent" 
              class="px-6 py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors border border-[#737373]"
            >
              Previous
            </button>
            <button 
              @click="nextEvent" 
              class="px-6 py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        
        <div class="flex items-center justify-center">
          <div class="w-full aspect-square bg-[#232323] rounded-lg flex items-center justify-center border border-[#737373]">
            <Image v-if="!currentEvent.image" class="w-24 h-24 text-[#737373]" />
            <img v-else :src="currentEvent.image" alt="Event image" class="w-full h-full object-cover rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Image, Zap } from 'lucide-vue-next';
import AppLayout from '../components/AppLayout.vue';
import { useEventStore } from '../store/events';
import type { Event } from '../types/event';

const eventStore = useEventStore();
const events = ref<Event[]>([]);
const currentIndex = ref(0);
const loading = ref(true);
const error = ref('');

const currentEvent = ref<Event>({
  id: '',
  title: '',
  description: '',
  date: new Date(),
  location: '',
  category: ''
});

onMounted(async () => {
  await loadEvents();
});

const loadEvents = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    events.value = await eventStore.getAllEvents();
    if (events.value.length > 0) {
      currentEvent.value = events.value[0];
    }
  } catch (err) {
    console.error('Failed to load events:', err);
    error.value = 'Failed to load events. Please try again.';
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const nextEvent = () => {
  if (currentIndex.value < events.value.length - 1) {
    currentIndex.value++;
    currentEvent.value = events.value[currentIndex.value];
  }
};

const previousEvent = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    currentEvent.value = events.value[currentIndex.value];
  }
};
</script>