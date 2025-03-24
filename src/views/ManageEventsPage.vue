<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-6">Manage Events</h1>
      
      <!-- Statistics component -->
      <EventsStatistics @view-event-details="openEventDetails" />
      
      <div class="flex justify-between items-center mb-8">
        <button 
          @click="showCreateEventModal = true"
          class="px-6 py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors border border-[#737373]"
        >
          New Event
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

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(9);

onMounted(() => {
  loadUserEvents();
});

const loadUserEvents = () => {
  userEvents.value = eventStore.getUserEvents();
};

// Filter events based on search query
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

// Paginate filtered events
const paginatedEvents = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredEvents.value.slice(startIndex, endIndex);
});

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(filteredEvents.value.length / itemsPerPage.value);
});

// Handle page change
const handlePageChange = (page: number) => {
  currentPage.value = page;
  // Scroll to top when changing page
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Handle items per page change
const handleItemsPerPageChange = (items: number) => {
  itemsPerPage.value = items;
  // Reset to first page when changing items per page
  currentPage.value = 1;
};

// Reset pagination when filters change
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Event highlighting logic
const getEventHighlight = (event: Event) => {
  if (filteredEvents.value.length === 0) return '';
  
  // Sort events by date
  const sortedByDate = [...filteredEvents.value].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Find earliest and latest events
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