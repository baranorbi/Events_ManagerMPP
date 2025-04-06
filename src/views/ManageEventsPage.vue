<template>
  <AppLayout>
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">{{ error }}</p>
      <button 
        @click="loadUserEvents" 
        class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
      >
        Try Again
      </button>
    </div>
    
    <div v-else class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">Manage Events</h1>
      
      <!-- Statistics component -->
      <EventsStatistics @view-event-details="openEventDetails" />
      
      <div class="flex justify-between items-center mb-8">
        <button 
          @click="showCreateEventModal = true"
          class="mb-6 px-6 py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
        >
          + New Event
        </button>
        
        <!-- Search and filters -->
        <div class="relative flex-grow md:max-w-xs ml-4">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search your events..."
            class="w-full px-4 py-2 bg-[#232323] rounded-md text-[#D9D9D9] border border-[#737373] pr-10"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373] hover:text-[#D9D9D9]"
          >
            <X :size="16" />
          </button>
          <button @click="debugShowEvents" class="px-3 py-1 bg-gray-600 text-xs rounded">
            Debug: Check Store
          </button>
        </div>
        
        <!-- Legend for highlights -->
        <div class="flex items-center gap-4">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
            <span class="text-xs text-[#D9D9D9]">Earliest</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
            <span class="text-xs text-[#D9D9D9]">Latest</span>
          </div>
        </div>
      </div>
      
      <!-- Highlighted Events Grid with pagination -->
      <div v-if="paginatedEvents.length > 0">
        <div class="text-xs text-gray-400 mb-2">
          Showing {{ filteredEvents.length }} of {{ userEvents.length }} events
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            v-for="event in paginatedEvents" 
            :key="event.id"
            class="relative"
          >
            <!-- Highlight Badge -->
            <div 
              v-if="getEventHighlight(event)"
              class="absolute -top-3 -right-3 z-10 w-24 h-24 overflow-hidden"
            >
              <div 
                class="absolute transform rotate-45 bg-[#533673] text-white text-xs font-bold py-1 right-[-35px] top-[20px] w-[170px] text-center" 
                :class="getHighlightClass(getEventHighlight(event))"
              >
                {{ getEventHighlight(event) }}
              </div>
            </div>
            
            <!-- Event Card -->
            <EventCard 
              :event="event"
              :class="{'border-2 border-[#533673]': getEventHighlight(event)}"
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
        </div>
        
        <!-- Pagination controls -->
        <PaginationControls
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredEvents.length"
          :items-per-page="itemsPerPage"
          @page-change="handlePageChange"
          @items-per-page-change="handleItemsPerPageChange"
        />
      </div>
      
      <!-- Empty state -->
      <div v-else class="text-center py-12 bg-[#232323] rounded-lg border border-[#737373]">
        <div v-if="searchQuery">
          <div class="text-[#737373] text-lg">No events found matching your search</div>
          <button 
            @click="searchQuery = ''"
            class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Clear Search
          </button>
        </div>
        <div v-else>
          <div class="text-[#737373] text-lg">You haven't created any events yet</div>
          <button 
            @click="showCreateEventModal = true"
            class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Create Your First Event
          </button>
        </div>
      </div>
    </div>
    
    <!-- Create Event Modal -->
    <CreateEventModal 
      v-if="showCreateEventModal"
      @created="eventCreated"
      @close="showCreateEventModal = false"
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
import { ref, computed, onMounted, watch } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import EventCard from '../components/EventCard.vue';
import CreateEventModal from '../components/CreateEventModal.vue';
import EditEventModal from '../components/EditEventModal.vue';
import EventDetailsModal from '../components/EventDetailsModal.vue';
import EventsStatistics from '../components/EventsStatistics.vue';
import PaginationControls from '../components/PaginationControls.vue';
import { X } from 'lucide-vue-next';
import { useEventStore } from '../store/events';
import type { Event } from '../types/event';

const eventStore = useEventStore();
const userEvents = ref<Event[]>([]);
const searchQuery = ref('');
const showCreateEventModal = ref(false);
const showEditEventModal = ref(false);
const showEventDetailsModal = ref(false);
const selectedEventId = ref('');
const loading = ref(true);
const error = ref('');

const currentPage = ref(1);
const itemsPerPage = ref(9);

onMounted(async () => {
  await loadUserEvents();
});

const debugShowEvents = async () => {
  const events = await eventStore.getUserEvents();
  console.log('Current events in store:', events);
  alert(`Found ${events.length} events in the store`);
};

const loadUserEvents = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    userEvents.value = await eventStore.getUserEvents();
  } catch (err) {
    console.error('Failed to load user events:', err);
    error.value = 'Failed to load your events. Please try again.';
  } finally {
    loading.value = false;
  }
};

// search query
const filteredEvents = computed(() => {
  if (!searchQuery.value) {
    return userEvents.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return userEvents.value.filter(event => 
    event.title.toLowerCase().includes(query) || 
    event.description.toLowerCase().includes(query) ||
    event.location.toLowerCase().includes(query) ||
    event.category.toLowerCase().includes(query)
  );
});

const paginatedEvents = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredEvents.value.slice(startIndex, endIndex);
});

const totalPages = computed(() => {
  return Math.ceil(filteredEvents.value.length / itemsPerPage.value);
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleItemsPerPageChange = (items: number) => {
  itemsPerPage.value = items;
  currentPage.value = 1;
};

watch(searchQuery, () => {
  currentPage.value = 1;
});

const getEventHighlight = (event: Event) => {
  if (filteredEvents.value.length === 0) return '';
  
  const sortedByDate = [...filteredEvents.value].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const earliestEvent = sortedByDate[0];
  const latestEvent = sortedByDate[sortedByDate.length - 1];
  
  if (event.id === earliestEvent.id) return 'EARLIEST';
  if (event.id === latestEvent.id) return 'LATEST';
  
  return '';
};

const getHighlightClass = (highlightType: string) => {
  switch (highlightType) {
    case 'EARLIEST':
      return 'bg-blue-600';
    case 'LATEST': 
      return 'bg-purple-600';
    default:
      return 'bg-[#533673]';
  }
};

const editEvent = (eventId: string) => {
  selectedEventId.value = eventId;
  showEditEventModal.value = true;
};

const openEventDetails = (eventId: string) => {
  selectedEventId.value = eventId;
  showEventDetailsModal.value = true;
};

const eventCreated = async (newEventId: any) => {
  console.log('Event created with ID:', newEventId);
  
  try {
    await loadUserEvents();
    showCreateEventModal.value = false; // Close the modal here
    alert('Event created successfully!');
  } catch (error) {
    console.error('Error refreshing events after creation:', error);
    alert('Event may have been created but the display couldn\'t be refreshed. Please reload the page.');
  }
};


const eventUpdated = async () => {
  await loadUserEvents();
};

const eventDeleted = async (eventId: string) => {
  try {
    const result = await eventStore.deleteEvent(eventId);
    
    if (result.success) {
      // Always reload events after successful deletion
      await loadUserEvents();
      
      // Close the modal if it's open
      showEditEventModal.value = false;
      
      // Show success notification
      alert('Event deleted successfully.');
    } else {
      throw new Error(result.error || 'Unknown error deleting event');
    }
  } catch (error) {
    console.error('Failed to delete event:', eventId, error);
    
    if (error instanceof Error) {
      alert(`Failed to delete event: ${error.message}`);
    } else {
      alert('An error occurred while deleting the event. Please try again.');
    }
  }
};
</script>