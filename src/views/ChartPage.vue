<template>
    <AppLayout>
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold">Event Analytics</h1>
          <div class="flex items-center">
            <button 
              @click="refreshData" 
              class="flex items-center gap-2 px-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
              :disabled="isRefreshing"
            >
              <RefreshCw :size="16" :class="{ 'animate-spin': isRefreshing }" />
              <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh Data' }}</span>
            </button>
          </div>
        </div>
        
        <!-- Event Generation Controls -->
        <div class="bg-[#232323] rounded-lg p-6 border border-[#737373] mb-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-[#D9D9D9] mb-2">Real-time Event Generation</h2>
              <p class="text-[#737373] mb-4 md:mb-0">Generate events in real-time via WebSocket connection</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :class="wsStatusClass"></div>
                <span class="text-[#D9D9D9] text-sm">WebSocket: {{ isWebSocketConnected ? 'Connected' : 'Disconnected' }}</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-2" :class="generationStatusClass"></div>
                <span class="text-[#D9D9D9] text-sm">Generation: {{ isGenerating ? 'Active' : 'Inactive' }}</span>
              </div>
              <button
                @click="reconnectWebSocket"
                class="px-3 py-1 bg-[#333333] rounded text-[#D9D9D9] text-sm hover:bg-[#444444]"
                title="Reconnect WebSocket"
              >
                <RefreshCw :size="14" />
              </button>
              <button
                @click="toggleRealtimeGeneration"
                class="px-4 py-2 rounded text-white text-sm"
                :class="isGenerating ? 'bg-red-600 hover:bg-red-700' : 'bg-[#533673] hover:bg-opacity-90'"
              >
                {{ isGenerating ? 'Stop Generation' : 'Start Generation' }}
              </button>
              <button
                @click="generateBatchEvents"
                class="px-4 py-2 bg-[#333333] rounded text-[#D9D9D9] text-sm hover:bg-[#444444]"
                :disabled="isGeneratingBatch"
              >
                {{ isGeneratingBatch ? 'Generating...' : 'Generate Batch' }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#533673]"></div>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8 bg-red-900 bg-opacity-20 rounded-lg border border-red-800">
          <p class="text-red-400">{{ error }}</p>
          <button 
            @click="loadData" 
            class="mt-4 px-4 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <!-- Charts Container -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Category Distribution Chart -->
          <div class="bg-[#232323] rounded-lg p-6 border border-[#737373]">
            <h3 class="text-xl font-semibold text-[#D9D9D9] mb-4">Categories</h3>
            <div class="h-60">
              <canvas ref="categoryChartRef"></canvas>
            </div>
          </div>
          
          <!-- Event Format Chart (Online vs In-Person) -->
          <div class="bg-[#232323] rounded-lg p-6 border border-[#737373]">
            <h3 class="text-xl font-semibold text-[#D9D9D9] mb-4">Event Format</h3>
            <div class="flex justify-between items-center mb-2">
              <span class="text-[#D9D9D9]">Online: {{ onlineEventsCount }}</span>
              <span class="text-[#D9D9D9]">In-Person: {{ offlineEventsCount }}</span>
            </div>
            <div class="h-56">
              <canvas ref="formatChartRef"></canvas>
            </div>
            <div class="text-center mt-2 text-sm text-[#737373]">
              {{ onlinePercentage }}% of events are online
            </div>
          </div>
          
          <!-- Timeline Chart -->
          <div class="bg-[#232323] rounded-lg p-6 border border-[#737373]">
            <h3 class="text-xl font-semibold text-[#D9D9D9] mb-4">Event Timeline</h3>
            <div class="h-60">
              <canvas ref="timelineChartRef"></canvas>
            </div>
          </div>
        </div>
        
        <!-- Event Log -->
        <div class="mt-8 bg-[#232323] rounded-lg p-6 border border-[#737373]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-[#D9D9D9]">Real-time Event Log</h3>
            <div class="text-sm text-[#737373]">
              Total events: {{ totalEvents }}
            </div>
          </div>
          
          <div class="overflow-y-auto max-h-60">
            <div v-if="eventLog.length === 0" class="text-center py-4 text-[#737373]">
              No events recorded yet. Start event generation to see the log.
            </div>
            <div 
              v-for="(event, index) in eventLog" 
              :key="index" 
              class="p-3 border-b border-[#333333] last:border-b-0"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-[#D9D9D9]">{{ event.title }}</span>
                <span class="text-xs text-[#737373]">{{ formatTime(event.timestamp) }}</span>
              </div>
              <div class="flex items-center mt-1 text-sm text-[#737373]">
                <span class="bg-[#533673] text-white text-xs px-2 py-0.5 rounded mr-2">{{ event.category }}</span>
                <span>{{ event.location }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
  import { RefreshCw } from 'lucide-vue-next';
  import AppLayout from '../components/AppLayout.vue';
  import { useEventStore } from '../store/events';
  import type { Event } from '../types/event';
  import { chartDataGenerator } from '../utils/dataGenerator';
  import websocketService from '../utils/websocketService';
  import Chart from 'chart.js/auto';
  import { toApiFormat } from '../utils/dataTransformUtils';
  
  // State
  const eventStore = useEventStore();
  const isLoading = ref(true);
  const isRefreshing = ref(false);
  const error = ref('');
  const events = ref<Event[]>([]);
  const totalEvents = ref(0);
  const categories = ref<string[]>([]);
  const eventLog = ref<Array<Event & { timestamp: Date }>>([]);
  const lastEventTime = ref<Date | null>(null);
  const isGeneratingBatch = ref(false);
  
  // Chart references
  const categoryChartRef = ref<HTMLCanvasElement | null>(null);
  const formatChartRef = ref<HTMLCanvasElement | null>(null);
  const timelineChartRef = ref<HTMLCanvasElement | null>(null);
  
  // Chart instances
  let categoryChart: Chart | null = null;
  let formatChart: Chart | null = null;
  let timelineChart: Chart | null = null;
  
  // Computed values
  const onlineEventsCount = computed(() => {
    return events.value.filter(e => e.isOnline).length;
  });
  
  const offlineEventsCount = computed(() => {
    return events.value.filter(e => !e.isOnline).length;
  });
  
  const onlinePercentage = computed(() => {
    if (events.value.length === 0) return 0;
    return Math.round((onlineEventsCount.value / events.value.length) * 100);
  });
  
  const isWebSocketConnected = computed(() => websocketService.isConnected.value);
  const isGenerating = computed(() => websocketService.isGenerating.value);
  
  const wsStatusClass = computed(() => {
    return isWebSocketConnected.value 
      ? 'bg-green-500' 
      : 'bg-red-500';
  });
  
  const generationStatusClass = computed(() => {
    return isGenerating.value 
      ? 'bg-green-500' 
      : 'bg-gray-500';
  });
  
  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };
  
  // Format time to HH:MM:SS
  const formatTimeForAPI = (date: Date): string => {
    return date.toTimeString().split(' ')[0]; // Returns HH:MM:SS
  };
  
  const refreshData = async () => {
  isRefreshing.value = true;
  error.value = '';
  
  try {
    const allEvents = await eventStore.getAllEvents();
    
    events.value = allEvents.map((event : any) => {
      const isEventOnline = typeof event.isOnline === 'boolean' 
        ? event.isOnline 
        : event.is_online === true || 
          ['Online', 'Remote', 'Virtual'].includes(event.location);
      return {
        ...event,
        isOnline: isEventOnline
      };
    });
    
    
    // Render charts with transformed data
    renderCharts();
  } catch (err) {
    error.value = 'Failed to refresh data';
    console.error(err);
  } finally {
    isRefreshing.value = false;
  }
};

const loadData = async () => {
  isLoading.value = true;
  error.value = '';
  
  try {
    const allEvents = await eventStore.getAllEvents();    
    // Use the same normalization logic as refreshData
    events.value = allEvents.map((event : any) => {
      const locationCheck = typeof event.location === 'string' && 
        event.location.toLowerCase().includes('online');
        
      return {
        ...event,
        isOnline: event.isOnline === true || locationCheck
      };
    });
    
    categories.value = [...new Set(events.value.map(e => e.category))];
    renderCharts();
  } catch (err) {
    error.value = 'Failed to load chart data. Please try again.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};
  
  const renderCharts = () => {
    nextTick(() => {
      renderCategoryChart();
      renderFormatChart();
      renderTimelineChart();
    });
  };
  
  const renderCategoryChart = () => {
    if (!categoryChartRef.value) return;
    
    // Cleanup previous chart
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    
    // Get category counts
    const categoryData = chartDataGenerator.enhanceCategoryData(events.value, categories.value);
    
    categoryChart = new Chart(categoryChartRef.value, {
      type: 'bar',
      data: {
        labels: categories.value.filter(c => c !== 'All categories'),
        datasets: [{
          label: 'Events by Category',
          data: categoryData,
          backgroundColor: [
            'rgba(83, 54, 115, 0.8)',
            'rgba(110, 64, 170, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderColor: [
            'rgba(83, 54, 115, 1)',
            'rgba(110, 64, 170, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#232323',
            titleColor: '#D9D9D9',
            bodyColor: '#D9D9D9',
            borderColor: '#737373',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#737373'
            },
            grid: {
              color: 'rgba(115, 115, 115, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#737373'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  };
  
  const renderFormatChart = () => {
    if (!formatChartRef.value) return;
    
    // Cleanup previous chart
    if (formatChart) {
        formatChart.destroy();
    }
    
    // Get online vs offline counts
    const [online, offline] = chartDataGenerator.enhanceOnlineVsOfflineData(events.value);
    
    formatChart = new Chart(formatChartRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Online', 'In-Person'],
        datasets: [{
          data: [online, offline],
          backgroundColor: [
            'rgba(83, 54, 115, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: [
            'rgba(83, 54, 115, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#737373'
            }
          },
          tooltip: {
            backgroundColor: '#232323',
            titleColor: '#D9D9D9',
            bodyColor: '#D9D9D9',
            borderColor: '#737373',
            borderWidth: 1
          }
        }
      }
    });
  };
  
  const renderTimelineChart = () => {
    if (!timelineChartRef.value) return;
    
    // Cleanup previous chart
    if (timelineChart) {
      timelineChart.destroy();
      timelineChart = null;
    }
    
    // Get timeline data
    const timelineData = chartDataGenerator.enhanceTimelineData(events.value);
    
    timelineChart = new Chart(timelineChartRef.value, {
      type: 'line',
      data: {
        labels: timelineData.labels,
        datasets: [{
          label: 'Events',
          data: timelineData.data,
          backgroundColor: 'rgba(83, 54, 115, 0.2)',
          borderColor: 'rgba(83, 54, 115, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(83, 54, 115, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(83, 54, 115, 1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#232323',
            titleColor: '#D9D9D9',
            bodyColor: '#D9D9D9',
            borderColor: '#737373',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#737373'
            },
            grid: {
              color: 'rgba(115, 115, 115, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#737373',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  };
  
  const generateBatchEvents = async () => {
  isGeneratingBatch.value = true;
  try {
    const categoryImages = {
      'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      'Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
      'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
      'Business': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
      'Food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
      'Art': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
      'Personal': 'https://images.unsplash.com/photo-1506863530036-1efeddceb993',
      'Work': 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc'
    };
    
    // Get available categories (filter out "All categories")
    const availableCategories = eventStore.getCategories().filter(c => c !== 'All categories');
    
    // Create 10 events
    for (let i = 0; i < 10; i++) {
      // Select random category from available categories
      const category = availableCategories[Math.floor(Math.random() * availableCategories.length)];
      const isOnline = Math.random() > 0.5;
      
      // Generate a date between tomorrow and 6 months from now
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      
      const randomDate = new Date(tomorrow.getTime() + Math.random() * (futureDate.getTime() - tomorrow.getTime()));
      
      const newEvent = {
        title: `Generated ${category} Event ${i + 1}`,
        description: `This is an automatically generated ${category} event for testing charts and visualizations.`,
        date: randomDate,
        location: isOnline ? 'Online' : ['New York', 'San Francisco', 'Chicago', 'Boston', 'Austin'][Math.floor(Math.random() * 5)],
        category: category,
        isOnline: isOnline,
        image: categoryImages[category as keyof typeof categoryImages] || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94' // Fallback image
      };
      
      await eventStore.createEvent(newEvent);
      
      // Add a small delay between creating events to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Refresh the data and charts
    // await refreshData();
    renderCharts();
    
  } catch (error) {
    console.error('Error generating batch events:', error);
  } finally {
    isGeneratingBatch.value = false;
  }
};
  
  const toggleRealtimeGeneration = () => {
    eventStore.toggleEventGeneration(!isGenerating.value);
  };
  
  const reconnectWebSocket = () => {
    websocketService.disconnect();
    setTimeout(() => {
      websocketService.connect();
    }, 500);
  };
  
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const handleEventUpdate = (data: any) => {
  if (data.action === 'created' && data.event) {
    // Convert from API format to client format properly
    const newEvent = {
      ...data.event,
      timestamp: new Date(),
      isOnline: Boolean(data.event.is_online),
      date: new Date(data.event.date) // Ensure date is a Date object
    };
    
    // Add to event log
    lastEventTime.value = new Date();
    eventLog.value.unshift(newEvent);
    if (eventLog.value.length > 100) {
      eventLog.value = eventLog.value.slice(0, 100);
    }
    
    // Add the new event to our local events array instead of reloading all
    events.value.push(newEvent);
    
    // Re-render just the charts without reloading all data
    renderCharts();
  }
};
  
  // Lifecycle hooks
  onMounted(async () => {
    await loadData();
    
    // Set up WebSocket event listeners
    websocketService.on('event_update', handleEventUpdate);
    websocketService.connect();
  });
  
  onUnmounted(() => {
    websocketService.off('event_update', handleEventUpdate);
    
    // Clean up charts
    if (categoryChart) {
      categoryChart.destroy();
      categoryChart = null;
    }
    
    if (formatChart) {
      formatChart.destroy();
      formatChart = null;
    }
    
    if (timelineChart) {
      timelineChart.destroy();
      timelineChart = null;
    }
  });
  
  // Watch for connection status changes
  watch(isWebSocketConnected, (isConnected) => {
    console.log('WebSocket connection status changed:', isConnected);
  });
  
  watch(isGenerating, (generating) => {
    console.log('Generation status changed:', generating);
  });
  </script>