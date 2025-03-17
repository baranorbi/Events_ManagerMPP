<template>
    <AppLayout>
      <div class="max-w-6xl mx-auto">
        <h1 class="text-4xl font-bold mb-6">Manage Events</h1>
        
        <button 
          @click="showCreateEventModal = true"
          class="px-6 py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors mb-8 border border-[#737373]"
        >
          New Event
        </button>
        
        <div v-if="userEvents.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EventCard 
            v-for="event in userEvents" 
            :key="event.id" 
            :event="event"
            @view-details="openEventDetails"
          >
            <template #actions>
              <button 
                @click="editEvent(event.id)"
                class="w-full mt-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
              >
                Edit / Remove
              </button>
            </template>
          </EventCard>
        </div>
        
        <div v-else class="text-center py-12 bg-[#232323] rounded-lg border border-[#737373]">
          <div class="text-[#737373] text-lg">You haven't created any events yet</div>
          <button 
            @click="showCreateEventModal = true"
            class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Create Your First Event
          </button>
        </div>
      </div>
      
      <!-- Create Event Modal -->
      <CreateEventModal 
        v-if="showCreateEventModal" 
        @close="showCreateEventModal = false"
        @created="eventCreated"
      />
      
      <!-- Edit Event Modal -->
      <EditEventModal
        v-if="showEditEventModal"
        :event-id="selectedEventId"
        @close="showEditEventModal = false"
        @saved="eventUpdated"
        @deleted="eventDeleted"
      />
      
      <!-- Event Details Modal -->
      <EventDetailsModal
        v-if="showEventDetailsModal"
        :event-id="selectedEventId"
        @close="showEventDetailsModal = false"
      />
    </AppLayout>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import AppLayout from '../components/AppLayout.vue';
  import EventCard from '../components/EventCard.vue';
  import CreateEventModal from '../components/CreateEventModal.vue';
  import EditEventModal from '../components/EditEventModal.vue';
  import EventDetailsModal from '../components/EventDetailsModal.vue';
  import { useEventStore } from '../store/events';
  import type { Event } from '../types/event';
  
  const eventStore = useEventStore();
  const userEvents = ref<Event[]>([]);
  const showCreateEventModal = ref(false);
  const showEditEventModal = ref(false);
  const showEventDetailsModal = ref(false);
  const selectedEventId = ref('');
  
  onMounted(() => {
    loadUserEvents();
  });
  
  const loadUserEvents = () => {
    userEvents.value = eventStore.getUserEvents();
  };
  
  const editEvent = (eventId: string) => {
    selectedEventId.value = eventId;
    showEditEventModal.value = true;
  };
  
  const openEventDetails = (eventId: string) => {
    selectedEventId.value = eventId;
    showEventDetailsModal.value = true;
  };
  
  const eventCreated = () => {
    loadUserEvents();
  };
  
  const eventUpdated = () => {
    loadUserEvents();
  };
  
  const eventDeleted = (eventId: string) => {
    const success = eventStore.deleteEvent(eventId);
    
    if (success) {
      // If successful, reload events and close modal
      loadUserEvents();
      showEditEventModal.value = false;
    } else {
      // Handle error case
      console.error('Failed to delete event:', eventId);
      alert('Failed to delete event. Please try again.');
    }
  };
  </script>