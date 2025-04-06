<template>
  <div class="bg-[#232323] border border-[#737373] rounded-lg p-6 mb-8">
    <h2 class="text-2xl font-bold mb-4 text-[#D9D9D9]">Event Statistics</h2>
    
    <div v-if="loading" class="flex justify-center py-6">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#533673]"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-6">
      <p class="text-red-500">{{ error }}</p>
      <button 
        @click="loadData" 
        class="mt-4 px-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
      >
        Try Again
      </button>
    </div>
    
    <div v-else>
      <!-- Statistics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Most Popular Category -->
        <div class="bg-[#1A1A1A] rounded-lg p-4 border border-[#737373]">
          <h3 class="text-lg font-medium mb-2 text-[#D9D9D9]">Popular Category</h3>
          <div class="flex items-center">
            <div class="w-12 h-12 bg-[#533673] rounded-full flex items-center justify-center text-white">
              <ChartPieIcon :size="24" />
            </div>
            <div class="ml-4">
              <div class="text-xl font-bold text-[#D9D9D9]">{{ mostPopularCategory }}</div>
              <div class="text-sm text-[#737373]">{{ categoryStats[mostPopularCategory] || 0 }} events</div>
            </div>
          </div>
        </div>
        
        <!-- Upcoming Events -->
        <div class="bg-[#1A1A1A] rounded-lg p-4 border border-[#737373]">
          <h3 class="text-lg font-medium mb-2 text-[#D9D9D9]">Upcoming Events</h3>
          <div class="flex items-center">
            <div class="w-12 h-12 bg-[#533673] rounded-full flex items-center justify-center text-white">
              <Calendar :size="24" />
            </div>
            <div class="ml-4">
              <div class="text-xl font-bold text-[#D9D9D9]">{{ upcomingEventsCount }}</div>
              <div class="text-sm text-[#737373]">Next 30 days</div>
            </div>
          </div>
        </div>
        
        <!-- Online vs In-Person -->
        <div class="bg-[#1A1A1A] rounded-lg p-4 border border-[#737373]">
          <h3 class="text-lg font-medium mb-2 text-[#D9D9D9]">Event Format</h3>
          <div class="flex items-center mb-3">
            <div class="w-12 h-12 bg-[#533673] rounded-full flex items-center justify-center text-white">
              <MonitorIcon :size="24" />
            </div>
            <div class="ml-4">
              <div class="flex items-center">
                <span class="text-xl font-bold text-[#D9D9D9]">{{ onlineEventsPercentage }}%</span>
                <span class="ml-2 text-sm text-[#737373]">Online</span>
              </div>
              <div class="flex items-center">
                <span class="text-xl font-bold text-[#D9D9D9]">{{ 100 - onlineEventsPercentage }}%</span>
                <span class="ml-2 text-sm text-[#737373]">In-Person</span>
              </div>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="w-full bg-[#333333] rounded-full h-2">
            <div 
              class="bg-[#533673] h-2 rounded-full" 
              :style="`width: ${onlineEventsPercentage}%`"
            ></div>
          </div>
        </div>
        
        <!-- Events Timeline Distribution -->
        <div class="bg-[#1A1A1A] rounded-lg p-4 border border-[#737373]">
          <h3 class="text-lg font-medium mb-2 text-[#D9D9D9]">Timeline</h3>
          <div class="flex items-center">
            <div class="w-12 h-12 bg-[#533673] rounded-full flex items-center justify-center text-white">
              <ClockIcon :size="24" />
            </div>
            <div class="ml-4 w-full">
              <div class="grid grid-cols-3 gap-2 text-center mb-1">
                <div class="text-xs text-[#737373]">Past</div>
                <div class="text-xs text-[#737373]">This Month</div>
                <div class="text-xs text-[#737373]">Future</div>
              </div>
              <div class="w-full flex h-6 rounded-md overflow-hidden">
                <div 
                  class="bg-[#4B5563] h-full flex items-center justify-center text-xs text-white"
                  :style="`width: ${pastEventsPercentage}%`"
                >
                  {{ pastEventsCount }}
                </div>
                <div 
                  class="bg-[#533673] h-full flex items-center justify-center text-xs text-white"
                  :style="`width: ${currentMonthEventsPercentage}%`"
                >
                  {{ currentMonthEventsCount }}
                </div>
                <div 
                  class="bg-[#8B5CF6] h-full flex items-center justify-center text-xs text-white"
                  :style="`width: ${futureEventsPercentage}%`"
                >
                  {{ futureEventsCount }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Event with Longest Description -->
        <div class="bg-[#1A1A1A] rounded-lg p-4 border border-[#737373]">
          <h3 class="text-lg font-medium mb-2 text-[#D9D9D9]">Most Detailed Event</h3>
          <div class="flex">
            <div class="w-12 h-12 bg-[#533673] rounded-full flex items-center justify-center text-white shrink-0">
              <FileTextIcon :size="24" />
            </div>
            <div class="ml-4">
              <div class="text-lg font-bold text-[#D9D9D9] truncate">{{ longestDescriptionEvent?.title || 'N/A' }}</div>
              <div class="text-sm text-[#737373]">{{ longestDescriptionEvent?.description?.length || 0 }} characters</div>
              <button 
                v-if="longestDescriptionEvent"
                @click="viewEventDetails(longestDescriptionEvent.id)"
                class="mt-2 text-xs text-[#533673] hover:underline"
              >
                View event
              </button>
            </div>
          </div>
        </div>
        
        <!-- Busiest Day -->
        <div class="bg-[#1A1A1A] rounded-lg p-4 border border-[#737373]">
          <h3 class="text-lg font-medium mb-2 text-[#D9D9D9]">Busiest Day</h3>
          <div class="flex">
            <div class="w-12 h-12 bg-[#533673] rounded-full flex items-center justify-center text-white">
              <CalendarDaysIcon :size="24" />
            </div>
            <div class="ml-4">
              <div class="text-lg font-bold text-[#D9D9D9]">{{ busiestDay.date || 'None' }}</div>
              <div class="text-sm text-[#737373]">{{ busiestDay.count }} events</div>
              <div class="text-xs text-[#D9D9D9] mt-1">{{ busiestDay.events.join(', ') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  Calendar, 
  ChartPie as ChartPieIcon, 
  Monitor as MonitorIcon, 
  Clock as ClockIcon, 
  FileText as FileTextIcon,
  CalendarDays as CalendarDaysIcon
} from 'lucide-vue-next';
import { useEventStore } from '../store/events';
import type { Event } from '../types/event';

const emit = defineEmits(['view-event-details']);
const eventStore = useEventStore();
const allEvents = ref<Event[]>([]);
const userEvents = ref<Event[]>([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    allEvents.value = await eventStore.getAllEvents();
    userEvents.value = await eventStore.getUserEvents();
  } catch (err) {
    console.error('Failed to load statistics data:', err);
    error.value = 'Failed to load statistics. Please try again.';
  } finally {
    loading.value = false;
  }
};

const categoryStats = computed(() => {
  const stats: Record<string, number> = {};
  
  allEvents.value.forEach(event => {
    if (!stats[event.category]) {
      stats[event.category] = 0;
    }
    stats[event.category]++;
  });
  
  return stats;
});

const mostPopularCategory = computed(() => {
  let maxCount = 0;
  let popularCategory = 'None';
  
  Object.entries(categoryStats.value).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count;
      popularCategory = category;
    }
  });
  
  return popularCategory;
});

// (next 30 days)
const upcomingEventsCount = computed(() => {
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  return allEvents.value.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= thirtyDaysLater;
  }).length;
});

// online vs in-person
const onlineEvents = computed(() => {
  return allEvents.value.filter(event => event.isOnline === true);
});

const onlineEventsPercentage = computed(() => {
  if (allEvents.value.length === 0) return 0;
  return Math.round((onlineEvents.value.length / allEvents.value.length) * 100);
});

const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const pastEventsCount = computed(() => {
  return allEvents.value.filter(event => new Date(event.date) < firstDayOfMonth).length;
});

const currentMonthEventsCount = computed(() => {
  return allEvents.value.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= firstDayOfMonth && eventDate <= lastDayOfMonth;
  }).length;
});

const futureEventsCount = computed(() => {
  return allEvents.value.filter(event => new Date(event.date) > lastDayOfMonth).length;
});

const totalEventsCount = computed(() => {
  return pastEventsCount.value + currentMonthEventsCount.value + futureEventsCount.value;
});

const pastEventsPercentage = computed(() => {
  if (totalEventsCount.value === 0) return 33;
  return Math.max(10, Math.round((pastEventsCount.value / totalEventsCount.value) * 100));
});

const currentMonthEventsPercentage = computed(() => {
  if (totalEventsCount.value === 0) return 34;
  return Math.max(10, Math.round((currentMonthEventsCount.value / totalEventsCount.value) * 100));
});

const futureEventsPercentage = computed(() => {
  if (totalEventsCount.value === 0) return 33;
  return Math.max(10, Math.round((futureEventsCount.value / totalEventsCount.value) * 100));
});

const longestDescriptionEvent = computed(() => {
  if (allEvents.value.length === 0) return null;
  
  return allEvents.value.reduce((longest, current) => {
    const longestLength = longest?.description?.length || 0;
    const currentLength = current.description?.length || 0;
    
    return currentLength > longestLength ? current : longest;
  }, null as Event | null);
});

// busiest (day with most events)
const busiestDay = computed(() => {
  const dayEventCounts: Record<string, { count: number, events: string[] }> = {};
  
  allEvents.value.forEach(event => {
    const dateString = new Date(event.date).toDateString();
    
    if (!dayEventCounts[dateString]) {
      dayEventCounts[dateString] = { count: 0, events: [] };
    }
    
    dayEventCounts[dateString].count++;
    dayEventCounts[dateString].events.push(event.title);
  });
  
  let maxDate = '';
  let maxCount = 0;
  
  Object.entries(dayEventCounts).forEach(([date, data]) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      maxDate = date;
    }
  });
  
  return { 
    date: maxDate ? new Date(maxDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None',
    count: maxCount,
    events: maxDate ? dayEventCounts[maxDate].events : []
  };
});

const viewEventDetails = (eventId: string) => {
  emit('view-event-details', eventId);
};
</script>