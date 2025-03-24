<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        v-for="event in sortedAndHighlightedEvents" 
        :key="event.id"
        class="relative"
      >
        <!-- Highlight Badge -->
        <div 
          v-if="event.highlight"
          class="absolute -top-3 -right-3 z-10 w-24 h-24 overflow-hidden"
        >
          <div 
            class="absolute transform rotate-45 bg-[#533673] text-white text-xs font-bold py-1 right-[-35px] top-[20px] w-[170px] text-center" 
            :class="getHighlightClass(event.highlight)"
          >
            {{ event.highlight }}
          </div>
        </div>
        
        <!-- Event Card -->
        <EventCard 
          :event="event"
          :class="{'border-2 border-[#533673]': event.highlight}"
          @view-details="$emit('view-details', event.id)"
        >
          <template #actions>
            <slot name="actions" :event="event"></slot>
          </template>
        </EventCard>
      </div>
    </div>
    
    <div v-if="events.length === 0" class="text-center py-12 bg-[#232323] rounded-lg border border-[#737373]">
      <div class="text-[#737373] text-lg">No events available</div>
      <slot name="empty-state"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EventCard from './EventCard.vue';
import type { Event } from '../types/event';

const props = defineProps<{
  events: Event[];
}>();

defineEmits(['view-details']);

const sortedAndHighlightedEvents = computed(() => {
  if (!props.events.length) return [];
  
  const today = new Date();
  
  const sortedByDate = [...props.events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const earliestEvent = sortedByDate[0];
  
  const latestEvent = sortedByDate[sortedByDate.length - 1];
  
  const longestDescription = props.events.reduce((longest, current) => 
    (current.description.length > longest.description.length) ? current : longest, 
    props.events[0]
  );
  
  const upcomingEvents = props.events.filter(e => new Date(e.date) >= today);
  const closestUpcoming = upcomingEvents.length ? 
    upcomingEvents.reduce((closest, current) => {
      const closestTime = Math.abs(new Date(closest.date).getTime() - today.getTime());
      const currentTime = Math.abs(new Date(current.date).getTime() - today.getTime());
      return currentTime < closestTime ? current : closest;
    }, upcomingEvents[0]) : null;
  
  // events to add highlight property
  return props.events.map(event => {
    let highlight = '';
    
    if (event.id === earliestEvent.id) {
      highlight = 'EARLIEST';
    } else if (event.id === latestEvent.id) {
      highlight = 'LATEST';
    } else if (event.id === longestDescription.id) {
      highlight = 'DETAILED';
    } else if (closestUpcoming && event.id === closestUpcoming.id) {
      highlight = 'UPCOMING';
    }
    
    return {
      ...event,
      highlight
    };
  });
});

const getHighlightClass = (highlightType: string) => {
  switch (highlightType) {
    case 'EARLIEST':
      return 'bg-blue-600';
    case 'LATEST': 
      return 'bg-purple-600';
    case 'DETAILED':
      return 'bg-green-600';
    case 'UPCOMING':
      return 'bg-orange-600';
    default:
      return 'bg-[#533673]';
  }
};
</script>