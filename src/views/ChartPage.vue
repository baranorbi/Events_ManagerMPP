<template>
  <AppLayout>
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">{{ error }}</p>
      <button 
        @click="tryAgain" 
        class="mt-4 px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
      >
        Try Again
      </button>
    </div>
    
    <div v-else ref="chartContainer" class="container mx-auto p-4">
      <h1 class="text-2xl font-bold text-[#D9D9D9] mb-6">Analytics Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Events by Category Chart -->
        <div class="bg-[#232323] p-6 rounded-lg border border-[#737373]">
          <h2 class="text-xl font-semibold text-[#D9D9D9] mb-4">Events by Category</h2>
          <div class="h-64">
            <canvas ref="categoryChartCanvas"></canvas>
          </div>
        </div>
        
        <!-- Events Timeline Chart -->
        <div class="bg-[#232323] p-6 rounded-lg border border-[#737373]">
          <h2 class="text-xl font-semibold text-[#D9D9D9] mb-4">Events Timeline</h2>
          <div class="h-64">
            <canvas ref="timelineChartCanvas"></canvas>
          </div>
        </div>
        
        <!-- Online vs In-Person Events Chart -->
        <div class="bg-[#232323] p-6 rounded-lg border border-[#737373]">
          <h2 class="text-xl font-semibold text-[#D9D9D9] mb-4">Online vs In-Person Events</h2>
          <div class="h-64">
            <canvas ref="onlineVsOfflineChartCanvas"></canvas>
          </div>
        </div>
      </div>
      
      <div class="mt-6 flex justify-center space-x-4">
        <button 
          @click="refreshChartData(false)" 
          class="px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          :disabled="refreshing"
        >
          {{ refreshing ? 'Refreshing...' : 'Refresh Charts' }}
        </button>
        <button 
          @click="generateMoreData"
          class="px-6 py-2 bg-[#6B4595] rounded-md text-white hover:bg-opacity-90 transition-colors"
          :disabled="generating"
        >
          {{ generating ? 'Generating...' : 'Generate More Data' }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { useEventStore } from '../store/events';
import { useAuthStore } from '../store/auth';
import AppLayout from '../components/AppLayout.vue';
import type { Event } from '../types/event';
import { chartDataGenerator } from '../utils/dataGenerator';
import axios from 'axios';

const chartContainer = ref(null);
const categoryChartCanvas = ref<HTMLCanvasElement | null>(null);
const timelineChartCanvas = ref<HTMLCanvasElement | null>(null);
const onlineVsOfflineChartCanvas = ref<HTMLCanvasElement | null>(null);

let categoryChart: Chart | null = null;
let timelineChart: Chart | null = null;
let onlineVsOfflineChart: Chart | null = null;
const eventStore = useEventStore();
const authStore = useAuthStore();

let refreshInterval: number | null = null;

const events = ref<Event[]>([]);
const loading = ref(true);
const error = ref('');
const refreshing = ref(false);
const generating = ref(false);

const chartColors = [
  'rgba(83, 54, 115, 0.8)',  // Primary purple
  'rgba(255, 99, 132, 0.8)',  // Red
  'rgba(54, 162, 235, 0.8)',  // Blue
  'rgba(255, 206, 86, 0.8)',  // Yellow
  'rgba(75, 192, 192, 0.8)',  // Teal
  'rgba(153, 102, 255, 0.8)', // Purple
  'rgba(255, 159, 64, 0.8)',  // Orange
  'rgba(199, 199, 199, 0.8)'  // Gray
];

const darkTheme = {
  color: '#D9D9D9',
  gridColor: '#737373',
  backgroundColor: '#232323'
};

const tryAgain = () => {
  loadDataAndInitCharts();
};

onMounted(() => {
  loadDataAndInitCharts();
  
  // every 30 seconds refresh
  refreshInterval = window.setInterval(() => {
    refreshChartData(false);
  }, 30000);
});

const loadDataAndInitCharts = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    await loadEvents();
    
    // ensure DOM is fully rendered
    setTimeout(() => {
      initCharts();
      loading.value = false;
    }, 300);
  } catch (err) {
    console.error('Failed to load initial data:', err);
    error.value = 'Failed to load chart data. Please try again.';
    loading.value = false;
  }
};

onBeforeUnmount(() => {
  destroyCharts();
  if (refreshInterval) clearInterval(refreshInterval);
});

const loadEvents = async () => {
  try {
    // Use the store method instead of direct API call
    const allEvents = await eventStore.getAllEvents();
    console.log('All events loaded:', allEvents.length);
    
    events.value = allEvents;
    return allEvents;
  } catch (err) {
    console.error('Failed to load events:', err);
    throw err;
  }
};

const destroyCharts = () => {
  if (categoryChart) {
    categoryChart.destroy();
    categoryChart = null;
  }
  
  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
  }
  
  if (onlineVsOfflineChart) {
    onlineVsOfflineChart.destroy();
    onlineVsOfflineChart = null;
  }
};

const initCharts = async () => {
  console.log('Initializing charts...');
  destroyCharts();
  
  await nextTick();
  
  if (!categoryChartCanvas.value || !timelineChartCanvas.value || !onlineVsOfflineChartCanvas.value) {
    console.error('Canvas elements not found, will retry once more');
    
    setTimeout(async () => {
      await nextTick();
      
      if (!categoryChartCanvas.value) {
        console.error('Category chart canvas still not found after retry');
        error.value = 'Unable to initialize charts. Please refresh the page.';
        return;
      }
      
      createCharts();
    }, 500);
    
    return;
  }
  
  createCharts();
};

const createCharts = () => {
  // Create Category Chart
  console.log('Creating category chart with canvas:', categoryChartCanvas.value);
  categoryChart = new Chart(categoryChartCanvas.value!, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: chartColors,
        borderColor: '#232323',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: darkTheme.color,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
  
  // Create Timeline Chart
  console.log('Creating timeline chart with canvas:', timelineChartCanvas.value);
  timelineChart = new Chart(timelineChartCanvas.value!, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Events',
        data: [],
        borderColor: chartColors[0],
        backgroundColor: 'rgba(83, 54, 115, 0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: darkTheme.gridColor
          },
          ticks: {
            color: darkTheme.color
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: darkTheme.gridColor
          },
          ticks: {
            color: darkTheme.color,
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: darkTheme.color
          }
        }
      }
    }
  });
  
  // Create Online/Offline Chart
  console.log('Creating online/offline chart with canvas:', onlineVsOfflineChartCanvas.value);
  onlineVsOfflineChart = new Chart(onlineVsOfflineChartCanvas.value!, {
    type: 'doughnut',
    data: {
      labels: ['Online', 'In-Person'],
      datasets: [{
        data: [0, 0],
        backgroundColor: [chartColors[2], chartColors[0]],
        borderColor: '#232323',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: darkTheme.color,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
  
  if (events.value.length > 0) {
    updateCharts();
  }
};

const updateCharts = () => {
  if (events.value.length === 0) {
    error.value = 'No event data available. Generate some demo data to see charts.';
    return;
  }
  
  try {
    const currentEvents = [...events.value];
    
    if (categoryChart) {
      updateCategoryChart(currentEvents);
      categoryChart.update('default');
    }
    
    if (timelineChart) {
      updateTimelineChart(currentEvents);
      timelineChart.update('default');
    }
    
    if (onlineVsOfflineChart) {
      updateOnlineVsOfflineChart(currentEvents);
      onlineVsOfflineChart.update('default');
    }
    
    if (chartContainer.value) {
      const container = chartContainer.value as HTMLElement;
      void container.offsetHeight; // ignore the return value
    }
  } catch (err) {
    console.error('Error updating charts:', err);
  }
};

const refreshChartData = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true;
    error.value = '';
  } else {
    refreshing.value = true;
  }
  
  try {
    await loadEvents();
    console.log('Events refreshed, count:', events.value.length);
    
    if (events.value.length === 0) {
      error.value = 'No events found to display.';
      return;
    }
    
    if (categoryChart && timelineChart && onlineVsOfflineChart) {
      console.log('Updating existing charts with new data');
      updateCategoryChart(events.value);
      updateTimelineChart(events.value);
      updateOnlineVsOfflineChart(events.value);
      
      // Force update all charts
      categoryChart.update('default');
      timelineChart.update('default');
      onlineVsOfflineChart.update('default');
    } else {
      console.log('Charts need initialization, reinitializing...');
      destroyCharts();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await nextTick();
      
      if (!categoryChartCanvas.value || !timelineChartCanvas.value || !onlineVsOfflineChartCanvas.value) {
        console.error('Canvas elements not found, re-initializing component...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await nextTick();
        
        initCharts();
      } else {
        console.log('Canvas elements found, creating charts...');
        createCharts();
      }
    }
  } catch (err) {
    console.error('Failed to refresh chart data:', err);
    error.value = 'Failed to load chart data. Please try again.';
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const updateCategoryChart = (events: Event[]) => {
  if (!categoryChart) {
    console.error('Category chart not initialized');
    return;
  }
  
  const allCategories = eventStore.getCategories().filter(c => c !== 'All categories');
  console.log('Categories:', allCategories);
  const categoryCounts = chartDataGenerator.enhanceCategoryData(events, allCategories);
  console.log('Category counts:', categoryCounts);
  
  categoryChart.data.labels = [...allCategories];
  categoryChart.data.datasets[0].data = [...categoryCounts];
  
  categoryChart.update('default');
  console.log('Category chart updated, current data:', categoryChart.data.datasets[0].data);
};

const updateTimelineChart = (events: Event[]) => {
  if (!timelineChart) {
    console.error('Timeline chart not initialized');
    return;
  }
  
  const timelineData = chartDataGenerator.enhanceTimelineData(events);
  console.log('Timeline data:', timelineData);
  
  timelineChart.data.labels = timelineData.labels;
  timelineChart.data.datasets[0].data = timelineData.data;
  timelineChart.update();
  console.log('Timeline chart updated');
};

const updateOnlineVsOfflineChart = (events: Event[]) => {
  if (!onlineVsOfflineChart) {
    console.error('Online/Offline chart not initialized');
    return;
  }
  
  console.log('Events for online/offline chart:', events.map(e => ({ id: e.id, title: e.title, isOnline: e.isOnline })));
  const [onlineCount, inPersonCount] = chartDataGenerator.enhanceOnlineVsOfflineData(events);
  console.log('Online count:', onlineCount, 'In-person count:', inPersonCount);
  
  onlineVsOfflineChart.data.datasets[0].data = [onlineCount, inPersonCount];
  onlineVsOfflineChart.update();
  console.log('Online/Offline chart updated');
};

const generateMoreData = async () => {
  generating.value = true;
  error.value = '';
  
  try {
    const baseEvents = await eventStore.getAllEvents();
    const enhancedEvents = chartDataGenerator.enhanceEvents(baseEvents, 5);
    
    const userId = authStore.getUser()?.id || 'user1';
    let successCount = 0;
    let errorCount = 0;
    
    for (const event of enhancedEvents) {
      if (event.id.startsWith('generated-')) {
        try {
          const { id, ...newEvent } = event;
          
          const eventToCreate = {
            ...newEvent,
            title: newEvent.title || `Event ${Date.now()}`,
            description: newEvent.description || 'Generated event description',
            category: newEvent.category || 'Conference',
            location: newEvent.location || 'Remote',
            is_online: newEvent.isOnline || false,
            date: typeof newEvent.date === 'string' ? newEvent.date : new Date().toISOString().split('T')[0],
            created_by: userId
          };
          
          console.log('Creating event with data:', eventToCreate);
          await eventStore.createEvent(eventToCreate);
          successCount++;
        } catch (e) {
          errorCount++;
          if (axios.isAxiosError(e) && e.response) {
            console.error('Failed to create event:', e.response.data);
          } else {
            console.error('Failed to create event:', e);
          }
        }
      }
    }
    
    if (successCount > 0) {
      await refreshChartData(false);
      alert(`Successfully created ${successCount} events!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
    } else {
      throw new Error('No events were created successfully');
    }
    
  } catch (err) {
    console.error('Failed to generate more data:', err);
    error.value = 'Failed to generate demo data. Please try again.';
  } finally {
    generating.value = false;
  }
};
</script>