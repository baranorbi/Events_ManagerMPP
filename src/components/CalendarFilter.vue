<template>
  <div class="bg-[#232323] border border-[#737373] rounded-md shadow-lg p-6 w-[350px]">
    <!-- Month Navigation -->
    <div class="flex justify-between items-center mb-6">
      <button 
        @click="previousMonth" 
        class="p-2 rounded-md hover:bg-[#333333]"
      >
        <ChevronLeft :size="24" class="text-[#D9D9D9]" />
      </button>
      <div class="text-[#D9D9D9] font-medium text-lg">
        {{ currentMonthName }} {{ currentYear }}
      </div>
      <button 
        @click="nextMonth" 
        class="p-2 rounded-md hover:bg-[#333333]"
      >
        <ChevronRight :size="24" class="text-[#D9D9D9]" />
      </button>
    </div>

    <!-- Days of Week -->
    <div class="grid grid-cols-7 gap-1 mb-3">
      <div 
        v-for="day in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" 
        :key="day" 
        class="text-center text-sm text-[#737373] p-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Days -->
    <div class="grid grid-cols-7 gap-1">
      <button 
        v-for="date in calendarDates" 
        :key="date.getTime()" 
        @click="selectDate(date)"
        class="p-3 text-center text-base rounded-md hover:bg-[#333333]"
        :class="getDateClasses(date)"
      >
        {{ date.getDate() }}
      </button>
    </div>

    <!-- Date Range Display -->
    <div class="flex justify-between items-center mt-6 text-base">
      <div class="text-[#D9D9D9]">
        <span>Start: {{ startDateFormatted }}</span>
      </div>
      <div class="text-[#D9D9D9]">
        <span>End: {{ endDateFormatted }}</span>
      </div>
    </div>
    
    <!-- Apply Button -->
    <button 
      @click="applyDateRange"
      class="mt-6 w-full py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors text-base font-medium"
    >
      Apply Date Range
    </button>
  </div>
</template>
  
<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
  
  const props = defineProps<{
    initialStartDate?: Date;
    initialEndDate?: Date;
  }>();
  
  const emit = defineEmits(['apply-date-range']);
  
  const currentMonth = ref(new Date());
  const startDate = ref<Date | null>(props.initialStartDate || null);
  const endDate = ref<Date | null>(props.initialEndDate || null);
  const isSelectingEndDate = ref(false);
  
  const currentMonthName = computed(() => {
    return currentMonth.value.toLocaleString('default', { month: 'long' });
  });
  
  const currentYear = computed(() => {
    return currentMonth.value.getFullYear();
  });
  
  const calendarDates = computed(() => {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const dates = [];
    
    // Add previous month's days to fill the first row
    for (let i = 0; i < startingDayOfWeek; i++) {
      const day = new Date(year, month, -startingDayOfWeek + i + 1);
      dates.push(day);
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      dates.push(day);
    }
    
    // Add next month's days to complete the last row
    const remainingDays = 42 - dates.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      dates.push(day);
    }
    
    return dates;
  });
  
  const startDateFormatted = computed(() => {
    return startDate.value ? formatDate(startDate.value) : 'Not set';
  });
  
  const endDateFormatted = computed(() => {
    return endDate.value ? formatDate(endDate.value) : 'Not set';
  });
  
  const previousMonth = () => {
    const newMonth = new Date(currentMonth.value);
    newMonth.setMonth(newMonth.getMonth() - 1);
    currentMonth.value = newMonth;
  };
  
  const nextMonth = () => {
    const newMonth = new Date(currentMonth.value);
    newMonth.setMonth(newMonth.getMonth() + 1);
    currentMonth.value = newMonth;
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const selectDate = (date: Date) => {
    if (!startDate.value || isSelectingEndDate.value) {
      if (!startDate.value || date >= startDate.value) {
        endDate.value = new Date(date);
        isSelectingEndDate.value = false;
      } else {
        endDate.value = new Date(startDate.value);
        startDate.value = new Date(date);
        isSelectingEndDate.value = false;
      }
    } else {
      // Setting start date
      startDate.value = new Date(date);
      isSelectingEndDate.value = true;
    }
  };
  
  const getDateClasses = (date: Date) => {
    const isToday = date.toDateString() === new Date().toDateString();
    const isStartDate = startDate.value && date.toDateString() === startDate.value.toDateString();
    const isEndDate = endDate.value && date.toDateString() === endDate.value.toDateString();
    const isInRange = startDate.value && endDate.value && 
                      date >= startDate.value && date <= endDate.value;
    const isCurrentMonth = date.getMonth() === currentMonth.value.getMonth();
    
    return {
      'bg-[#533673] text-white': isStartDate || isEndDate,
      'bg-[#533673] bg-opacity-30': isInRange && !isStartDate && !isEndDate,
      'text-[#D9D9D9]': isCurrentMonth && !isStartDate && !isEndDate,
      'text-[#737373]': !isCurrentMonth,
      'border border-white': isToday
    };
  };
  
  const applyDateRange = () => {
    if (startDate.value && endDate.value) {
      emit('apply-date-range', {
        startDate: startDate.value,
        endDate: endDate.value
      });
    }
  };
  
  onMounted(() => {
    if (props.initialStartDate) {
      startDate.value = new Date(props.initialStartDate);
    } else {
      // Default to today
      startDate.value = new Date();
    }
    
    if (props.initialEndDate) {
      endDate.value = new Date(props.initialEndDate);
    } else {
      // Default to a month from today
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      endDate.value = nextMonth;
    }
    
    // Set calendar to show the month of the start date
    if (startDate.value) {
      currentMonth.value = new Date(startDate.value);
    }
  });
  </script>