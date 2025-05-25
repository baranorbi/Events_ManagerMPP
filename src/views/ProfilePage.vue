<template>
  <AppLayout>
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">{{ error }}</p>
      <button 
        @click="loadData" 
        class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
      >
        Try Again
      </button>
    </div>
    
    <div v-else class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h1 class="text-4xl font-bold">{{ userData.name }}</h1>
          <p class="text-xl text-[#737373] mt-2">{{ userData.description }}</p>
          
          <div class="mt-6 space-y-4">
            <router-link to="/manage-events" class="block w-full py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors text-center">
              Manage My Events
            </router-link>
            <button class="w-full py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors">
              Manage My Profile
            </button>
          </div>
        </div>
        
        <div class="flex items-center justify-center">
          <div class="w-64 h-64 bg-[#232323] rounded-lg flex items-center justify-center border border-[#737373]">
            <Image v-if="!userData.avatar" class="w-24 h-24 text-[#737373]" />
            <img v-else :src="userData.avatar" alt="User avatar" class="w-full h-full object-cover rounded-lg" />
          </div>
        </div>
      </div>
      
      <h2 class="text-3xl font-bold mb-6">Interested Events</h2>
      
      <div v-if="loadingInterested" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#533673]"></div>
      </div>
      
      <div v-else-if="interestedEvents.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EventCard 
          v-for="event in interestedEvents" 
          :key="event.id" 
          :event="event"
          @view-details="openEventDetails"
        >
          <template #actions>
            <button 
              @click="removeFromInterested(event.id)"
              class="w-full mt-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
            >
              Remove
            </button>
          </template>
        </EventCard>
      </div>
      
      <div v-else class="text-center py-12 bg-[#232323] rounded-lg border border-[#737373]">
        <div class="text-[#737373] text-lg">You haven't added any events to your interested list yet</div>
        <router-link to="/" class="inline-block mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors">
          Browse Events
        </router-link>
      </div>
      
      <!-- Event Details Modal -->
      <EventDetailsModal
        v-if="showEventDetailsModal"
        :event-id="selectedEventId"
        @close="showEventDetailsModal = false"
        @removed-from-interested="loadInterestedEvents"
      />
      
      <!-- Add 2FA section -->
      <div class="mt-10 bg-[#232323] rounded-lg p-6 border border-[#333]">
        <h2 class="text-2xl font-bold mb-4">Security Settings</h2>
        
        <div class="mb-4">
          <h3 class="text-lg font-semibold mb-2">Two-Factor Authentication</h3>
          <p class="text-gray-400 mb-4">
            Add an extra layer of security to your account by requiring both your password and authentication code from your mobile device.
          </p>
          
          <button 
            v-if="!showTwoFactorSetup" 
            @click="showTwoFactorSetup = true"
            class="px-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Manage Two-Factor Authentication
          </button>
        </div>
        
        <!-- Two-factor setup dialog -->
        <div v-if="showTwoFactorSetup" class="mt-6 border-t border-[#444] pt-6">
          <TwoFactorSetup />
          <div class="mt-4 text-right">
            <button 
              @click="showTwoFactorSetup = false"
              class="px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Image } from 'lucide-vue-next';
import AppLayout from '../components/AppLayout.vue';
import EventCard from '../components/EventCard.vue';
import EventDetailsModal from '../components/EventDetailsModal.vue';
import TwoFactorSetup from '../components/TwoFactorSetup.vue';
import { useEventStore } from '../store/events';
import type { Event, User } from '../types/event';

const eventStore = useEventStore();
const userData = ref<User>({
  id: '',
  name: '',
  description: '',
  events: [],
  interestedEvents: []
});
const interestedEvents = ref<Event[]>([]);
const showEventDetailsModal = ref(false);
const selectedEventId = ref('');
const loading = ref(true);
const loadingInterested = ref(true);
const error = ref('');
const showTwoFactorSetup = ref(false);

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    userData.value = await eventStore.getUserData();
    await loadInterestedEvents();
  } catch (err) {
    console.error('Failed to load user data:', err);
    error.value = 'Failed to load user data. Please try again.';
  } finally {
    loading.value = false;
  }
};

const loadInterestedEvents = async () => {
  loadingInterested.value = true;
  
  try {
    interestedEvents.value = await eventStore.getInterestedEvents();
  } catch (err) {
    console.error('Failed to load interested events:', err);
  } finally {
    loadingInterested.value = false;
  }
};

const removeFromInterested = async (eventId: string) => {
  try {
    const success = await eventStore.removeFromInterested(eventId);
    if (success) {
      await loadInterestedEvents();
    }
  } catch (err) {
    console.error('Failed to remove from interested:', err);
  }
};

const openEventDetails = (eventId: string) => {
  selectedEventId.value = eventId;
  showEventDetailsModal.value = true;
};
</script>