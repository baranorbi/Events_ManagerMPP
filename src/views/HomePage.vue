<template>
  <AppLayout @search="handleSearch">
    <div class="max-w-6xl mx-auto">
      <!-- Offline banner -->
      <div v-if="connectionStatus !== 'online' && displayedEvents.length > 0" class="mb-6 bg-yellow-600 bg-opacity-20 border border-yellow-600 text-yellow-500 p-3 rounded-md">
        <p class="flex items-center">
          <Database class="mr-2" :size="18" />
          Viewing cached events from your last online session. Some features may be limited.
        </p>
      </div>

      <!-- Filters section -->
      <div class="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <!-- Filter by category dropdown -->
        <div class="relative category-dropdown">
          <button 
            @click="toggleCategoryDropdown"
            class="flex items-center space-x-2 px-4 py-2 bg-[#232323] rounded-md border border-[#737373] hover:bg-[#333333] transition-colors"
          >
            <span>{{ filters.category }}</span>
            <ChevronDown :size="16" />
          </button>
          
          <div 
            v-if="showCategoryDropdown" 
            class="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-[#232323] border border-[#737373]"
          >
            <div class="py-1">
              <button 
                v-for="category in categories" 
                :key="category" 
                @click="selectCategory(category)"
                class="block w-full text-left px-4 py-2 text-sm hover:bg-[#333333] transition-colors"
                :class="filters.category === category ? 'text-[#533673] font-medium' : 'text-[#D9D9D9]'"
              >
                {{ category }}
              </button>
            </div>
          </div>
        </div>
        <!-- Sort by dropdown -->
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
            :disabled="isLoadingMore"
          >
            <span v-if="isLoadingMore">Loading...</span>
            <span v-else>Apply Filters</span>
          </button>
          
          <button 
            @click="resetFilters"
            class="px-4 py-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors"
            :disabled="isLoadingMore"
          >
            Reset
          </button>
        </div>
      </div>    
      <!-- Loading state (initial load) -->
      <div v-if="isInitialLoading" class="flex justify-center py-12">
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
      
      <!-- Events with infinite scrolling -->
      <div v-else-if="filteredEvents.length > 0" class="container mx-auto px-4 py-8">
        <FixedInfiniteScroll
          ref="infiniteScrollRef"
          :loading="isLoadingMore"
          :has-more="hasMoreItems" 
          :max-items="pageSize * 2"
          @load-more="loadMoreItems"
          @remove-items="removeTopItems"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div v-for="event in displayedEvents" :key="event.id">
              <EventCard 
                :event="event" 
                @view-details="openEventDetails"
              />
            </div>
          </div>
        </FixedInfiniteScroll>
      </div>
              
      <div v-else class="text-center py-12 bg-[#232323] rounded-lg">
        <div class="text-[#737373] text-lg">No events found matching your criteria</div>
        <button 
          @click="resetFilters"
          class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <!-- Events list -->
      <div v-else class="events-container">
        <!-- Events grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div v-for="event in displayedEvents" :key="event.id">
            <EventCard 
              :event="event"
              @view-details="openEventDetails(event.id)"
            />
          </div>
        </div>
        
        <!-- Load more indicator -->
        <div v-if="hasMoreItems && !isLoadingMore" 
             ref="loadMoreTrigger" 
             class="text-center text-gray-500 p-4 my-4">
          Scroll for more...
        </div>
        
        <!-- Loading more indicator -->
        <div v-if="isLoadingMore" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#533673]"></div>
        </div>
        
      </div>
      <!-- Event Details Modal -->
      <EventDetailsModal
        v-if="showEventDetailsModal"
        :event-id="selectedEventId"
        @close="showEventDetailsModal = false"
        @added-to-interested="handleAddedToInterested"
        @removed-from-interested="handleRemovedFromInterested"
      />

      <div v-else-if="isLoadingMore" class="mt-4 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#533673]"></div>
      </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, onBeforeUnmount } from 'vue';
import { ChevronDown, Calendar, Play, SortAsc, SortDesc, Database } from 'lucide-vue-next';
import AppLayout from '../components/AppLayout.vue';
import EventCard from '../components/EventCard.vue';
import EventDetailsModal from '../components/EventDetailsModal.vue';
import CalendarFilter from '../components/CalendarFilter.vue';
import InfiniteScroll from '../components/InfiniteScroll.vue';
import { RequestManager } from '../utils/requestUtils';
import { useEventStore } from '../store/events';
import { useRoute } from 'vue-router';
import type { Event } from '../types/event';
import { toClientFormat } from '../utils/dataTransformUtils';
import FixedInfiniteScroll from '../components/FixedInfiniteScroll.vue';
import { useOfflineStore } from '../store/offlineStore';

const route = useRoute();
const eventStore = useEventStore();
const filteredEvents = ref<Event[]>([]);
const displayedEvents = ref<Event[]>([]);
const showSortDropdown = ref(false);
const categories = eventStore.getCategories();

const showCategoryDropdown = ref(false);
const showEventDetailsModal = ref(false);
const selectedEventId = ref('');
const isInitialLoading = ref(true);
const isLoadingMore = ref(false);
const isComponentMounted = ref(true);
const error = ref('');

const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value;
};

const pageSize = 12; // Number of items to load at once
const currentPage = ref(1);
const hasMoreItems = ref(true);
const totalEvents = ref(0);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const requestManager = new RequestManager();

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
  isComponentMounted.value = true;
});

onUnmounted(() => {
  isComponentMounted.value = false;
  requestManager.abort();
});

type InfiniteScrollInstance = InstanceType<typeof InfiniteScroll>;
const infiniteScrollRef = ref<InfiniteScrollInstance | null>(null);


const lastPaginationResponse = ref('');

onMounted(() => {
  const checkForMore = () => {
    if (hasMoreItems.value && !isLoadingMore.value && isComponentMounted.value) {
      const scrollBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // If we're within 1000px of the bottom
      if (documentHeight - scrollBottom < 1000) {
        loadMoreItems();
      }
    }
  };
  
  window.addEventListener('scroll', checkForMore, { passive: true });
  
  setTimeout(checkForMore, 500);
  
  // check periodically
  const intervalId = setInterval(() => {
    if (hasMoreItems.value && displayedEvents.value.length > pageSize * 2) {
      removeTopItems(pageSize);
    }
  }, 1500);
  
  onUnmounted(() => {
    window.removeEventListener('scroll', checkForMore);
    clearInterval(intervalId);
  });
});

let observer: IntersectionObserver | null = null;

const createScrollObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  nextTick(() => {
    if (!loadMoreTrigger.value) return;
    
    observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting && hasMoreItems.value && !isLoadingMore.value) {
        loadMoreItems();
      }
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px 200px 0px'
    });
    
    observer.observe(loadMoreTrigger.value);
  });
};


onMounted(() => {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (showSortDropdown.value && !target.closest('.sort-dropdown')) {
      showSortDropdown.value = false;
    }
  });
});

onMounted(async () => {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // One year ago
  
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 2); // Two years in future
  
  filters.value.startDate = formatDate(startDate);
  filters.value.endDate = formatDate(endDate);
  
  
  await loadEvents();
  
  createScrollObserver();
  
  if (route.query.eventId) {
    selectedEventId.value = route.query.eventId as string;
    showEventDetailsModal.value = true;
  }

  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
  document.removeEventListener('click', handleOutsideClick);
});

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  if (showCalendar.value && 
      !target.closest('.calendar-container') && 
      !target.closest('button[data-calendar-toggle]')) {
    showCalendar.value = false;
  }
  
  if (showSortDropdown.value && !target.closest('.sort-dropdown')) {
    showSortDropdown.value = false;
  }
  
  if (showCategoryDropdown.value && !target.closest('.category-dropdown')) {
    showCategoryDropdown.value = false;
  }
};

const loadEvents = async () => {
  isInitialLoading.value = true;
  error.value = '';
  
  try {
    const filterOptions = {
      category: filters.value.category !== 'All categories' ? filters.value.category : undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
      isOnline: filters.value.isOnline || undefined,
      search: filters.value.searchQuery || undefined,
      sortBy: filters.value.sortBy || 'date',
      sortOrder: filters.value.sortOrder || 'desc'
    };
    
    const paginatedData = await eventStore.getEventsPaginated(1, pageSize, filterOptions);
    
    lastPaginationResponse.value = JSON.stringify(paginatedData.pagination, null, 2);
    
    if (paginatedData && paginatedData.events) {
      const events = paginatedData.events.map(toClientFormat);
      
      currentPage.value = 1;
      displayedEvents.value = events;
      hasMoreItems.value = !!paginatedData.pagination.has_next;
      totalEvents.value = paginatedData.pagination.total_events;
            
      await nextTick();
      if (infiniteScrollRef.value) {
        infiniteScrollRef.value.createObserver();
        
        setTimeout(() => {
          if (infiniteScrollRef.value) {
            infiniteScrollRef.value.checkSentinelVisibility();
          }
        }, 500);
      }
    } else {
      displayedEvents.value = [];
      hasMoreItems.value = false;
      totalEvents.value = 0;
    }
  } catch (err) {
    console.error('Failed to load events:', err);
    error.value = 'Failed to load events. Please try again.';
  } finally {
    isInitialLoading.value = false;
  }
};

const windowSize = ref(pageSize * 3); // Show 3 pages at a time
const lastScrollY = ref(0);
const scrollThreshold = ref(200); // Pixels from bottom to trigger load more
const heightBeforeRemoval = ref(0);
const removingCooldown = ref(false);
const loadingCooldown = ref(false);

const loadMoreItems = async () => {
  if (isLoadingMore.value || !hasMoreItems.value || !isComponentMounted.value || loadingCooldown.value) {
    return;
  }
  
  loadingCooldown.value = true;
  setTimeout(() => {
    loadingCooldown.value = false;
  }, 1000); // 1 second cooldown
  
  const nextPage = currentPage.value + 1;  
  isLoadingMore.value = true;
  
  try {
    const options = {
      ...filters.value,
      sortBy: filters.value.sortBy || 'date',
      sortOrder: filters.value.sortOrder || 'desc'
    };
    
    const response = await eventStore.getEventsPaginated(nextPage, pageSize, options);
    
    if (response && response.events && response.events.length > 0) {
      const beforeHeight = document.documentElement.scrollHeight;
      lastScrollY.value = window.scrollY;
      
      displayedEvents.value = [...displayedEvents.value, ...response.events];
      totalEvents.value = response.pagination.total_events;
      currentPage.value = nextPage;
      hasMoreItems.value = response.pagination.has_next;

      nextTick(() => {
        checkIfShouldRemoveTop();
      });
    } else {
      hasMoreItems.value = false;
    }
  } catch (err) {
    console.error(`Failed to load events for page ${nextPage}:`, err);
  } finally {
    isLoadingMore.value = false;
  }
};

const checkIfShouldRemoveTop = () => {
  if (displayedEvents.value.length <= windowSize.value || 
      window.scrollY < pageSize * 100 ||
      removingCooldown.value) {
    return;
  }
  
  removingCooldown.value = true;
  
  heightBeforeRemoval.value = document.documentElement.scrollHeight;
  const scrollYBeforeRemoval = window.scrollY;
  
  const itemsToRemove = pageSize;
  const oldEvents = [...displayedEvents.value];
  displayedEvents.value = displayedEvents.value.slice(itemsToRemove);
  
  nextTick(() => {
    const newHeight = document.documentElement.scrollHeight;
    const heightDifference = heightBeforeRemoval.value - newHeight;
    
    if (heightDifference > 0) {
      window.scrollTo({
        top: Math.max(0, scrollYBeforeRemoval - heightDifference),
        behavior: 'auto'
      });
    }
    
    setTimeout(() => {
      removingCooldown.value = false;
    }, 2000); // 2 seconds cooldown
  });
};

onMounted(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (documentHeight - (scrollY + windowHeight) < scrollThreshold.value && 
        !isLoadingMore.value && 
        hasMoreItems.value &&
        !loadingCooldown.value) {
      loadMoreItems();
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
});

const removeTopItems = (count: number) => {
  if (!displayedEvents.value || displayedEvents.value.length <= pageSize * 3) {
    return;
  }
  
  const minimumKeep = pageSize * 2;
  const itemsToRemove = Math.min(count, displayedEvents.value.length - minimumKeep);
  
  if (itemsToRemove <= 0) {
    return;
  }
  displayedEvents.value = displayedEvents.value.slice(itemsToRemove);
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

onBeforeUnmount(() => {
  requestManager.abort();
});

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format for API
};

const selectCategory = (category: string) => {
  if (filters.value.category !== category) {
    filters.value.category = category;
    showCategoryDropdown.value = false;
    applyFilters();
  } else {
    showCategoryDropdown.value = false;
  }
};

const toggleOnlineFilter = () => {
  filters.value.isOnline = !filters.value.isOnline;
};

const applyFilters = async () => {
  isInitialLoading.value = true;
  error.value = '';
  
  try {
    const filterOptions = {
      category: filters.value.category !== 'All categories' ? filters.value.category : undefined,
      startDate: filters.value.startDate ? new Date(filters.value.startDate) : undefined,
      endDate: filters.value.endDate ? new Date(filters.value.endDate) : undefined,
      isOnline: filters.value.isOnline || undefined,
      search: filters.value.searchQuery || undefined,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
      pagination: true,
      page: 1,
      page_size: pageSize
    };
    
    const paginatedData = await eventStore.getEventsPaginated(1, pageSize, filterOptions);
    
    if (paginatedData && paginatedData.events) {
      const events = paginatedData.events.map((event: any) => ({
        ...event,
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.date),
        location: event.location,
        category: event.category,
        isOnline: event.is_online || event.isOnline,
        startTime: event.start_time || event.startTime,
        endTime: event.end_time || event.endTime,
        createdBy: event.created_by || event.createdBy,
        image: event.image
      }));
      
      currentPage.value = 1;
      displayedEvents.value = events;
      hasMoreItems.value = paginatedData.pagination.has_next;
      totalEvents.value = paginatedData.pagination.total_events;
      
      nextTick(() => {
        createScrollObserver();
      });
      
    } else {
      displayedEvents.value = [];
      hasMoreItems.value = false;
      totalEvents.value = 0;
    }
  } catch (err) {
    console.error('Failed to apply filters:', err);
    error.value = 'Failed to filter events. Please try again.';
    displayedEvents.value = [];
  } finally {
    isInitialLoading.value = false;
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
  filters.value.searchQuery = query;
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

const { connectionStatus } = useOfflineStore();

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

</script>

<style scoped>
.events-container {
  min-height: 200px; /* Ensures container has height even when empty */
}
</style>