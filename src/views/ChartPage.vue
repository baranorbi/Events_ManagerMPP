<template>
    <AppLayout>
      <div class="container mx-auto p-4">
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
            @click="forceRefreshData" 
            class="px-6 py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Refresh Charts
          </button>
          <button 
            @click="generateMoreData" 
            class="px-6 py-2 bg-[#6B4595] rounded-md text-white hover:bg-opacity-90 transition-colors"
          >
            Generate More Data
          </button>
        </div>
      </div>
    </AppLayout>
  </template>
  
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';
import { useEventStore } from '../store/events';
import { useAuthStore } from '../store/auth';
import AppLayout from '../components/AppLayout.vue';
import type { Event } from '../types/event';
import { chartDataGenerator } from '../utils/dataGenerator';

const categoryChartCanvas = ref<HTMLCanvasElement | null>(null);
const timelineChartCanvas = ref<HTMLCanvasElement | null>(null);
const onlineVsOfflineChartCanvas = ref<HTMLCanvasElement | null>(null);

let categoryChart: Chart | null = null;
let timelineChart: Chart | null = null;
let onlineVsOfflineChart: Chart | null = null;
const eventStore = useEventStore();
const authStore = useAuthStore();

let refreshInterval: number | null = null;

const initialDataGenerated = ref(false);

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

onMounted(() => {
  initCharts();
  refreshChartData();
  
  // refresh data every 5 seconds
  refreshInterval = window.setInterval(() => {
    updateCharts();
  }, 5000);
});

onUnmounted(() => {
  if (categoryChart) categoryChart.destroy();
  if (timelineChart) timelineChart.destroy();
  if (onlineVsOfflineChart) onlineVsOfflineChart.destroy();
  
  if (refreshInterval) clearInterval(refreshInterval);
});

const initCharts = () => {
  if (categoryChartCanvas.value) {
    categoryChart = new Chart(categoryChartCanvas.value, {
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
  }
  
  if (timelineChartCanvas.value) {
    timelineChart = new Chart(timelineChartCanvas.value, {
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
  }
  
  if (onlineVsOfflineChartCanvas.value) {
    onlineVsOfflineChart = new Chart(onlineVsOfflineChartCanvas.value, {
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
              color: darkTheme.color
            }
          }
        }
      }
    });
  }
};


const refreshChartData = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let allEvents = eventStore.getAllEvents();
  const userId = authStore.getUser()?.id;
  
  if (!initialDataGenerated.value && allEvents.length < 10) {
    const enhancedEvents = chartDataGenerator.enhanceEvents(allEvents, 40);
    
    enhancedEvents.forEach(event => {
      if (event.id.startsWith('generated-')) {
        const { id, ...newEvent } = event;
        eventStore.createEvent({
          ...newEvent,
          createdBy: userId
        });
      }
    });
    
    initialDataGenerated.value = true;
    
    allEvents = eventStore.getAllEvents();
  }
  
  updateCategoryChart(allEvents);
  updateTimelineChart(allEvents);
  updateOnlineVsOfflineChart(allEvents);
};

const updateCharts = () => {
  const allEvents = eventStore.getAllEvents();
  updateCategoryChart(allEvents);
  updateTimelineChart(allEvents);
  updateOnlineVsOfflineChart(allEvents);
};

const forceRefreshData = () => {
  updateCharts();
};

const generateMoreData = async () => {
  const baseEvents = eventStore.getAllEvents();
  const enhancedEvents = chartDataGenerator.enhanceEvents(baseEvents, 5);
  
  const userId = authStore.getUser()?.id;
  
  enhancedEvents.forEach(event => {
    if (event.id.startsWith('generated-')) {
      const { id, ...newEvent } = event;
      eventStore.createEvent({
        ...newEvent,
        createdBy: userId
      });
    }
  });
  
  const updatedEvents = eventStore.getAllEvents();
  updateCategoryChart(updatedEvents);
  updateTimelineChart(updatedEvents);
  updateOnlineVsOfflineChart(updatedEvents);
};

const updateCategoryChart = (events: Event[]) => {
  if (!categoryChart) return;
  
  const allCategories = eventStore.getCategories().filter(c => c !== 'All categories');
  
  const categoryCounts = chartDataGenerator.enhanceCategoryData(events, allCategories);
  
  categoryChart.data.labels = allCategories;
  categoryChart.data.datasets[0].data = categoryCounts;
  categoryChart.update();
};

const updateTimelineChart = (events: Event[]) => {
  if (!timelineChart) return;
  
  const timelineData = chartDataGenerator.enhanceTimelineData(events);
  
  timelineChart.data.labels = timelineData.labels;
  timelineChart.data.datasets[0].data = timelineData.data;
  timelineChart.update();
};

const updateOnlineVsOfflineChart = (events: Event[]) => {
  if (!onlineVsOfflineChart) return;
  
  const [onlineCount, inPersonCount] = chartDataGenerator.enhanceOnlineVsOfflineData(events);
  
  onlineVsOfflineChart.data.datasets[0].data = [onlineCount, inPersonCount];
  onlineVsOfflineChart.update();
};
</script>