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
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Apply Filters</span>
        </button>
        
        <button 
          @click="resetFilters"
          class="px-4 py-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors"
          :disabled="isLoading"
        >
          Reset
        </button>
      </div>
    </div>
    <!-- Sort Dropdown -->
    <div class="relative sort-dropdown">
      <button 
        @click="showSortDropdown = !showSortDropdown"
        class="flex items-center gap-2 px-4 py-2 bg-[#232323] rounded-md border border-[#737373]"
      >
        <SortAsc v-if="filters.sortOrder === 'asc'" :size="16" class="text-[#D9D9D9]" />
        <SortDesc v-else :size="16" class="text-[#D9D9D9]" />
        <span class="text-[#D9D9D9]">{{ getSortLabel() }}</span>
      </button>
      
      <div v-if="showSortDropdown" class="absolute z-10 mt-1 w-64 bg-[#232323] border border-[#737373] rounded-md shadow-lg">
        <div class="py-1">
          <button 
            v-for="option in sortOptions" 
            :key="`${option.value}-${option.order}`"
            @click="selectSortOption(option)"
            class="block w-full text-left px-4 py-2 text-[#D9D9D9] hover:bg-[#333333]"
            :class="{'bg-[#333333]': filters.sortBy === option.value && filters.sortOrder === option.order}"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12 bg-[#232323] rounded-lg">
      <div class="text-red-500 text-lg">{{ error }}</div>
      <button 
        @click="loadEvents"
        class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
      >
        Try Again
      </button>
    </div>
    
    <!-- Events grid with pagination -->
    <div v-else-if="filteredEvents.length > 0" class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(event, index) in paginatedEvents" :key="`${event.id}-${index}`" class="flex flex-col h-full">
          <EventCard 
            :event="event" 
            @view-details="openEventDetails"
          />
        </div>
      </div>
      
      <!-- Add pagination controls -->
      <PaginationControls
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredEvents.length"
        :items-per-page="itemsPerPage"
        @page-change="handlePageChange"
        @items-per-page-change="handleItemsPerPageChange"
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
import { ref, computed, onMounted, watch } from 'vue';
import { ChevronDown, Calendar, Play, SortAsc, SortDesc } from 'lucide-vue-next';
import AppLayout from '../components/AppLayout.vue';
import EventCard from '../components/EventCard.vue';
import EventDetailsModal from '../components/EventDetailsModal.vue';
import CalendarFilter from '../components/CalendarFilter.vue';
import PaginationControls from '../components/PaginationControls.vue';
import { useEventStore } from '../store/events';
import { useRoute } from 'vue-router';
import type { Event } from '../types/event';

const route = useRoute();
const eventStore = useEventStore();
const allEvents = ref<Event[]>([]);
const filteredEvents = ref<Event[]>([]);
const showSortDropdown = ref(false);
const categories = eventStore.getCategories();

const showCategoryDropdown = ref(false);
const showEventDetailsModal = ref(false);
const selectedEventId = ref('');
const isLoading = ref(true);
const error = ref('');

const filters = ref({
  startDate: '',
  endDate: '',
  category: 'All categories',
  isOnline: false,
  searchQuery: '',
  sortBy: 'date',  // Default sort by date
  sortOrder: 'desc'  // Default newest first
});

const sortOptions = [
  { label: 'Date (Newest First)', value: 'date', order: 'desc' },
  { label: 'Date (Oldest First)', value: 'date', order: 'asc' },
  { label: 'Title (A-Z)', value: 'title', order: 'asc' },
  { label: 'Title (Z-A)', value: 'title', order: 'desc' },
  { label: 'Category (A-Z)', value: 'category', order: 'asc' },
  { label: 'Category (Z-A)', value: 'category', order: 'desc' },
  { label: 'Location (A-Z)', value: 'location', order: 'asc' },
  { label: 'Location (Z-A)', value: 'location', order: 'desc' }
];

const selectSortOption = (option: { value: string, order: string, label: string }) => {
  filters.value.sortBy = option.value;
  filters.value.sortOrder = option.order;
  showSortDropdown.value = false;
  applyFilters();
};

const getSortLabel = () => {
  const option = sortOptions.find(opt => 
    opt.value === filters.value.sortBy && opt.order === filters.value.sortOrder
  );
  return option ? option.label : 'Sort by';
};

onMounted(() => {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (showSortDropdown.value && !target.closest('.sort-dropdown')) {
      showSortDropdown.value = false;
    }
  });
});

const loadEvents = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    allEvents.value = await eventStore.getAllEvents();
    filteredEvents.value = allEvents.value;
  } catch (err) {
    console.error('Failed to load events:', err);
    error.value = 'Failed to load events. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadEvents();
  
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

const applyFilters = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    const filterOptions: any = {
      category: filters.value.category
    };
    
    // Add date filters if they exist
    if (filters.value.startDate) {
      filterOptions.startDate = getDateFromString(filters.value.startDate);
    }
    
    if (filters.value.endDate) {
      filterOptions.endDate = getDateFromString(filters.value.endDate);
    }
    
    // Add online filter
    if (filters.value.isOnline !== undefined) {
      filterOptions.isOnline = filters.value.isOnline;
    }
    
    // Add search query - this was missing
    if (filters.value.searchQuery) {
      filterOptions.search = filters.value.searchQuery;
    }
    
    // Add sorting parameters
    filterOptions.sortBy = filters.value.sortBy;
    filterOptions.sortOrder = filters.value.sortOrder;
    
    console.log('Applying filters with sorting:', filterOptions);
    
    // Apply filters and sorting
    filteredEvents.value = await eventStore.filterEvents(filterOptions);
    
    // Reset to first page when filters change
    currentPage.value = 1;
  } catch (err) {
    console.error('Failed to apply filters:', err);
    error.value = 'Failed to filter events. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const resetFilters = async () => {
  filters.value = {
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1))),
    category: 'All categories',
    isOnline: false,
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };
  
  await loadEvents();
};

const handleSearch = (query: string) => {
  console.log("Search query received:", query);
  filters.value.searchQuery = query;
  currentPage.value = 1; // Reset to first page when search changes
  applyFilters();
};

const openEventDetails = (eventId: string) => {
  selectedEventId.value = eventId;
  showEventDetailsModal.value = true;
};

const handleAddedToInterested = () => {
  // Refresh events if needed
};

const handleRemovedFromInterested = () => {
  // Refresh events if needed
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

const currentPage = ref(1);
const itemsPerPage = ref(9);

const paginatedEvents = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredEvents.value.slice(startIndex, endIndex);
});

const totalPages = computed(() => {
  return Math.ceil(filteredEvents.value.length / itemsPerPage.value) || 1;
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleItemsPerPageChange = (items: number) => {
  itemsPerPage.value = items;
  const maxPage = Math.ceil(filteredEvents.value.length / items) || 1;
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
  }
};

watch([() => filters.value, () => allEvents.value.length], () => {
  const maxPage = Math.ceil(filteredEvents.value.length / itemsPerPage.value) || 1;
  if (currentPage.value > maxPage) {
    currentPage.value = 1;
  }
}, { immediate: true });
</script>