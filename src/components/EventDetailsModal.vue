<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-[#232323] rounded-lg w-full max-w-4xl border border-[#737373] shadow-lg">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
      </div>
      
      <div v-else-if="error" class="p-8 text-center">
        <p class="text-red-500">{{ error }}</p>
        <button 
          @click="$emit('close')" 
          class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
        >
          Close
        </button>
      </div>
      
      <div v-else class="p-8">
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-2xl font-bold text-[#D9D9D9]">{{ event.title }}</h2>
          <button @click="$emit('close')" class="text-[#737373] hover:text-[#D9D9D9]">
            <X :size="24" />
          </button>
        </div>
        
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <div class="mb-6">
              <p class="text-[#737373] mb-1">Date</p>
              <p class="text-[#D9D9D9]">{{ formatDate(event.date) }}</p>
            </div>
            
            <div class="mb-6">
              <p class="text-[#737373] mb-1">Time</p>
              <p class="text-[#D9D9D9]">
                {{ event.startTime ? formatTime(event.startTime) : 'Not specified' }}
                {{ event.endTime ? ` - ${formatTime(event.endTime)}` : '' }}
              </p>
            </div>
            
            <div class="mb-6">
              <p class="text-[#737373] mb-1">Location</p>
              <p class="text-[#D9D9D9] flex items-center">
                <MapPin v-if="!event.isOnline" :size="16" class="mr-2" />
                <Video v-else :size="16" class="mr-2" />
                {{ event.location }}
                <span v-if="event.isOnline" class="ml-2 px-2 py-0.5 bg-[#533673] text-white text-xs rounded-full">Online</span>
              </p>
            </div>
            
            <div class="mb-6">
              <p class="text-[#737373] mb-1">Category</p>
              <p class="text-[#D9D9D9]">{{ event.category }}</p>
            </div>
            
            <div>
              <p class="text-[#737373] mb-1">Description</p>
              <p class="text-[#D9D9D9]">{{ event.description }}</p>
            </div>
            
            <div class="mt-8 flex gap-4">
              <button 
                v-if="!isUserEvent && !isInterested"
                @click="addToInterested"
                class="px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
                :disabled="interestActionLoading"
              >
                <span v-if="!interestActionLoading">Add to Interested</span>
                <span v-else>Adding...</span>
              </button>
              
              <button 
                v-if="!isUserEvent && isInterested"
                @click="removeFromInterested"
                class="px-6 py-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors border border-[#737373]"
                :disabled="interestActionLoading"
              >
                <span v-if="!interestActionLoading">Remove from Interested</span>
                <span v-else>Removing...</span>
              </button>
            </div>
          </div>
          
          <div class="flex items-center justify-center">
            <div class="w-full aspect-square bg-[#232323] rounded-lg flex items-center justify-center border border-[#737373]">
              <Image v-if="!event.image" class="w-24 h-24 text-[#737373]" />
              <img v-else :src="event.image" alt="Event image" class="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { X, MapPin, Video, Image } from 'lucide-vue-next';
import { useEventStore } from '../store/events';
import { useAuthStore } from '../store/auth';
import type { Event } from '../types/event';

const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits(['close', 'added-to-interested', 'removed-from-interested']);

const eventStore = useEventStore();
const authStore = useAuthStore();
const event = ref<Event>({
  id: '',
  title: '',
  description: '',
  date: new Date(),
  location: '',
  category: ''
});
const loading = ref(true);
const error = ref('');
const interestActionLoading = ref(false);

onMounted(async () => {
  await loadEvent();
  await checkIfInterested();
});

const loadEvent = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const eventData = await eventStore.getEventById(props.eventId);
    if (eventData) {
      event.value = eventData;
    } else {
      error.value = 'Event not found';
    }
  } catch (err) {
    console.error('Failed to load event:', err);
    error.value = 'Failed to load event details';
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (time: string) => {
  try {
    if (time.includes('T')) {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return time;
  } catch (e) {
    console.error('Error formatting time:', e);
    return time;
  }
};

const isUserEvent = computed(() => {
  const userId = authStore.getUser()?.id;
  return event.value.createdBy === userId;
});

const isInterested = ref(false);

const checkIfInterested = async () => {
  if (!authStore.checkAuth()) return;
  
  try {
    const userData = await eventStore.getUserData();
    isInterested.value = userData.interestedEvents.includes(event.value.id);
  } catch (error) {
    console.error('Error checking if event is in interested list:', error);
    isInterested.value = false; 
  }
};

const addToInterested = async () => {
  if (!authStore.checkAuth()) {
    alert('Please sign in to add events to your interested list');
    return;
  }
  
  interestActionLoading.value = true;
  
  try {
    const success = await eventStore.addToInterested(event.value.id);
    if (success) {
      emit('added-to-interested');
      await checkIfInterested();
    } else {
      throw new Error('Failed to add to interested list');
    }
  } catch (err) {
    console.error('Error adding to interested:', err);
    alert('Failed to add event to your interested list');
  } finally {
    interestActionLoading.value = false;
  }
};

const removeFromInterested = async () => {
  interestActionLoading.value = true;
  
  try {
    const success = await eventStore.removeFromInterested(event.value.id);
    if (success) {
      emit('removed-from-interested');
      await checkIfInterested();
    } else {
      throw new Error('Failed to remove from interested list');
    }
  } catch (err) {
    console.error('Error removing from interested:', err);
    alert('Failed to remove event from your interested list');
  } finally {
    interestActionLoading.value = false;
  }
};
</script>

