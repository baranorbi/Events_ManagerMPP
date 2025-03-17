<template>
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-[#232323] rounded-lg w-full max-w-2xl mx-4 border border-[#737373]">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">Event Details</h2>
            <button 
              @click="$emit('close')"
              class="p-2 rounded-md bg-[#232323] hover:bg-[#333333] transition-colors border border-[#737373]"
            >
              <X :size="20" class="text-[#D9D9D9]" />
            </button>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-xl font-semibold mb-2 text-[#D9D9D9]">{{ event.title }}</h3>
              <p class="text-[#737373] mb-4">{{ event.description }}</p>
              
              <div class="space-y-3">
                <div class="flex items-start">
                  <Calendar class="w-5 h-5 text-[#533673] mt-1 mr-3" />
                  <div>
                    <p class="font-medium text-[#D9D9D9]">Date & Time</p>
                    <p class="text-[#737373]">{{ formatDate(event.date) }}</p>
                    <p v-if="event.startTime" class="text-[#737373]">
                      {{ event.startTime }} - {{ event.endTime || 'TBD' }}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <Map class="w-5 h-5 text-[#533673] mt-1 mr-3" />
                  <div>
                    <p class="font-medium text-[#D9D9D9]">Location</p>
                    <p class="text-[#737373]">{{ event.location }}</p>
                    <p v-if="event.isOnline" class="text-green-400 text-sm">Online Event</p>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <Tag class="w-5 h-5 text-[#533673] mt-1 mr-3" />
                  <div>
                    <p class="font-medium text-[#D9D9D9]">Category</p>
                    <p class="text-[#737373]">{{ event.category }}</p>
                  </div>
                </div>
              </div>
              
              <div class="mt-6">
                <button 
                  v-if="!isInterested"
                  @click="addToInterested"
                  class="w-full py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors"
                >
                  Add to Interested
                </button>
                <button 
                  v-else
                  @click="removeFromInterested"
                  class="w-full py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors border border-[#737373]"
                >
                  Remove from Interested
                </button>
              </div>
            </div>
            
            <div class="flex items-center justify-center">
              <div class="w-full aspect-square bg-[#232323] rounded-lg flex items-center justify-center border border-[#737373]">
                <Image v-if="!event.image" class="w-24 h-24 text-[#737373]" />
                <img v-else :src="event.image" alt="Event image" class="w-full h-full object-cover rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { Calendar, Map, Tag, X, Image } from 'lucide-vue-next';
  import { useEventStore } from '../store/events';
  import type { Event } from '../types/event';
  
  const props = defineProps<{
    eventId: string;
  }>();
  
  const emit = defineEmits(['close', 'added-to-interested', 'removed-from-interested']);
  const eventStore = useEventStore();
  
  const event = ref<Event>({
    id: '',
    title: '',
    description: '',
    date: new Date(),
    location: '',
    category: ''
  });
  
  const isInterested = computed(() => {
    const userData = eventStore.getUserData();
    return userData.interestedEvents.includes(event.value.id);
  });
  
  onMounted(() => {
    const foundEvent = eventStore.getEventById(props.eventId);
    if (foundEvent) {
      event.value = foundEvent;
    }
  });
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const addToInterested = () => {
    if (eventStore.addToInterested(event.value.id)) {
      emit('added-to-interested', event.value.id);
    }
  };
  
  const removeFromInterested = () => {
    if (eventStore.removeFromInterested(event.value.id)) {
      emit('removed-from-interested', event.value.id);
    }
  };
  </script>