<template>
    <div class="bg-[#232323] rounded-lg overflow-hidden border border-[#737373] shadow-md hover:shadow-lg transition-shadow">
      <!-- Event Image -->
      <div class="relative h-48 overflow-hidden">
        <div v-if="!event.image" class="w-full h-full bg-[#333333] flex items-center justify-center">
          <Image class="w-16 h-16 text-[#737373]" />
        </div>
        <img 
          v-else 
          :src="event.image" 
          :alt="event.title" 
          class="w-full h-full object-cover"
        />
        
        <!-- Category Badge -->
        <div class="absolute top-3 right-3 px-3 py-1 bg-[#533673] text-white text-xs rounded-full">
          {{ event.category }}
        </div>
      </div>
      
      <!-- Event Details -->
      <div class="p-4">
        <h3 class="text-xl font-semibold text-[#FFFFFF] mb-2 line-clamp-1">{{ event.title }}</h3>
        
        <div class="flex items-center text-[#D9D9D9] mb-2">
          <Calendar class="w-4 h-4 mr-2" />
          <span class="text-sm">{{ formatDate(event.date) }}</span>
        </div>
        
        <div class="flex items-center text-[#D9D9D9] mb-3">
          <MapPin class="w-4 h-4 mr-2" />
          <span class="text-sm">{{ event.location }}</span>
          <span v-if="event.isOnline" class="ml-2 px-2 py-0.5 bg-[#533673] bg-opacity-20 text-[#D9D9D9] text-xs rounded-full">
            Online
          </span>
        </div>
        
        <p class="text-[#D9D9D9] text-sm mb-4 line-clamp-2">{{ event.description }}</p>
        
        <!-- Action Buttons -->
        <div>
          <slot name="actions">
            <button 
              @click="viewDetails"
              class="w-full py-2 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
            >
              Learn More
            </button>
          </slot>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { Calendar, MapPin, Image } from 'lucide-vue-next';
  import type { Event } from '../types/event';
  
  const props = defineProps<{
    event: Event
  }>();
  
  const emit = defineEmits(['view-details']);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const viewDetails = () => {
    emit('view-details', props.event.id);
  };
  </script>