<template>
    <AppLayout @search="handleSearch">
      <div class="mb-6 flex flex-wrap gap-4 items-center">
        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <button 
              @click="showCategoryDropdown = !showCategoryDropdown"
              class="flex items-center gap-2 px-4 py-2 bg-[#232323] rounded-md border border-[#737373]"
            >
              <ChevronDown :size="16" class="text-[#D9D9D9]" />
              <span class="text-[#D9D9D9]">{{ filters.category }}</span>
            </button>
            
            <div v-if="showCategoryDropdown" class="absolute z-10 mt-1 w-48 bg-[#232323] border border-[#737373] rounded-md shadow-lg">
              <div class="py-1">
                <button 
                  v-for="category in categories" 
                  :key="category"
                  @click="selectCategory(category)"
                  class="block w-full text-left px-4 py-2 text-[#D9D9D9] hover:bg-[#333333]"
                >
                  {{ category }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Date Filter -->
          <div class="relative">
            <button 
              @click="toggleCalendar"
              data-calendar-toggle
              class="flex items-center gap-2 px-4 py-2 bg-[#232323] rounded-md border border-[#737373]"
            >
              <Calendar :size="16" class="text-[#D9D9D9]" />
              <span class="text-[#D9D9D9]">Date Range</span>
            </button>
            
            <!-- Calendar Component Dropdown -->
            <div 
              v-if="showCalendar" 
              class="absolute z-20 mt-2 bg-[#232323] border border-[#737373] rounded-md shadow-xl calendar-container"
              style="transform: translateX(-25%);"
            >
              <CalendarFilter
                :initial-start-date="getDateFromString(filters.startDate)"
                :initial-end-date="getDateFromString(filters.endDate)"
                @apply-date-range="handleDateRangeSelection"
              />
            </div>
          </div>
          
          <button 
            @click="toggleOnlineFilter"
            class="flex items-center gap-2 px-4 py-2 bg-[#232323] rounded-md border border-[#737373]"
            :class="{ 'border-[#533673] text-[#D9D9D9]': filters.isOnline }"
          >
            <Play :size="16" class="text-[#D9D9D9]" />
            <span class="text-[#D9D9D9]">{{ filters.isOnline ? 'Online' : 'All Locations' }}</span>
          </button>
          
          <button 
            @click="applyFilters"
            class="px-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Apply Filters
          </button>
          
          <button 
            @click="resetFilters"
            class="px-4 py-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      
      <!-- Events Grid -->
      <div v-if="filteredEvents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <EventCard 
          v-for="event in filteredEvents" 
          :key="event.id" 
          :event="event"
          @view-details="openEventDetails"
        />
      </div>
      
      <div v-else class="text-center py-12 bg-[#232323] rounded-lg">
        <div class="text-[#737373] text-lg">No events found matching your criteria</div>
        <button 
          @click="resetFilters"
          class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
        >
          Reset Filters
        </button>
      </div>
      
      <!-- Event Details Modal -->
      <EventDetailsModal
        v-if="showEventDetailsModal"
        :event-id="selectedEventId"
        @close="showEventDetailsModal = false"
        @added-to-interested="handleAddedToInterested"
        @removed-from-interested="handleRemovedFromInterested"
      />
    </AppLayout>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { ChevronDown, Calendar, Play } from 'lucide-vue-next';
  import AppLayout from '../components/AppLayout.vue';
  import EventCard from '../components/EventCard.vue';
  import EventDetailsModal from '../components/EventDetailsModal.vue';
  import CalendarFilter from '../components/CalendarFilter.vue';
  import { useEventStore } from '../store/events';
  import { useRoute } from 'vue-router';
  import type { Event } from '../types/event';
  
  const route = useRoute();
  const eventStore = useEventStore();
  const allEvents = ref<Event[]>([]);
  const filteredEvents = ref<Event[]>([]);
  const categories = eventStore.getCategories();
  
  const showCategoryDropdown = ref(false);
  const showEventDetailsModal = ref(false);
  const selectedEventId = ref('');

  
  const filters = ref({
    startDate: '',
    endDate: '',
    category: 'All categories',
    isOnline: false,
    searchQuery: ''
  });
  
  
  const loadEvents = () => {
    allEvents.value = eventStore.getAllEvents();
    filteredEvents.value = allEvents.value;
  };
  
  onMounted(() => {
    loadEvents();
    
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    filters.value.startDate = formatDate(today);
    filters.value.endDate = formatDate(nextMonth);
    
    if (route.query.eventId) {
      selectedEventId.value = route.query.eventId as string;
      showEventDetailsModal.value = true;
    }

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (showCalendar.value && !target.closest('.calendar-container') && 
          !target.closest('button[data-calendar-toggle]')) {
        showCalendar.value = false;
      }
    });
  });
  
  watch([
    () => eventStore.getAllEvents().length, 
    () => eventStore.getUserEvents().length
  ], () => {
    loadEvents();
    applyFilters(); // re-apply filters when events change
  });
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const selectCategory = (category: string) => {
    filters.value.category = category;
    showCategoryDropdown.value = false;
  };
  
  const toggleOnlineFilter = () => {
    filters.value.isOnline = !filters.value.isOnline;
  };
  
  
  const applyFilters = () => {
    const filterOptions: any = {
      category: filters.value.category
    };
    
    if (filters.value.isOnline) {
      filterOptions.isOnline = true;
    }
    
    try {
      if (filters.value.startDate) {
        filterOptions.startDate = new Date(filters.value.startDate);
      }
      
      if (filters.value.endDate) {
        filterOptions.endDate = new Date(filters.value.endDate);
      }
    } catch (e) {
      console.error('Invalid date format');
    }
    
    // apply filters
    let filtered = eventStore.filterEvents(filterOptions);
    
    // apply search if exists
    if (filters.value.searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(filters.value.searchQuery.toLowerCase())
      );
    }
    
    filteredEvents.value = filtered;
  };
  
  const resetFilters = () => {
    filters.value = {
      startDate: formatDate(new Date()),
      endDate: formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
      category: 'All categories',
      isOnline: false,
      searchQuery: ''
    };
    
    filteredEvents.value = allEvents.value;
  };
  
  const handleSearch = (query: string) => {
    filters.value.searchQuery = query;
    applyFilters();
  };
  
  const openEventDetails = (eventId: string) => {
    selectedEventId.value = eventId;
    showEventDetailsModal.value = true;
  };
  
  const handleAddedToInterested = () => {
    // none
  };
  
  const handleRemovedFromInterested = () => {
    // none
  };

  const showCalendar = ref(false);

  const toggleCalendar = () => {
    showCalendar.value = !showCalendar.value;
    if (showCalendar.value) {
      showCategoryDropdown.value = false;
    }
  };

  const getDateFromString = (dateString: string): Date | undefined => {
    try {
      if (dateString) {
        return new Date(dateString);
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  const handleDateRangeSelection = (dateRange: { startDate: Date, endDate: Date }) => {
    filters.value.startDate = formatDate(dateRange.startDate);
    filters.value.endDate = formatDate(dateRange.endDate);
    showCalendar.value = false;
    applyFilters();
  };
  </script>