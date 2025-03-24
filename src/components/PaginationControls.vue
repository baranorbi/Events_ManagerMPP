<template>
  <div class="flex justify-center items-center mt-8">
    <div class="flex space-x-2 items-center">
      <!-- First page button -->
      <button 
        @click="changePage(1)" 
        :disabled="currentPage === 1 || totalPages === 0"
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        :class="currentPage === 1 || totalPages === 0
          ? 'text-[#737373] cursor-not-allowed' 
          : 'text-[#D9D9D9] hover:bg-[#333333]'"
      >
        <ChevronsLeft :size="16" />
      </button>
      
      <!-- Previous page button -->
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage === 1 || totalPages === 0"
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        :class="currentPage === 1 || totalPages === 0
          ? 'text-[#737373] cursor-not-allowed' 
          : 'text-[#D9D9D9] hover:bg-[#333333]'"
      >
        <ChevronLeft :size="16" />
      </button>
      
      <!-- Page numbers -->
      <div class="flex space-x-1">
        <button 
          v-for="page in safeDisplayedPageNumbers" 
          :key="page"
          @click="changePage(page)"
          class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          :class="currentPage === page 
            ? 'bg-[#333333] text-white' 
            : 'text-[#D9D9D9] hover:bg-[#333333]'"
        >
          {{ page }}
        </button>
      </div>
      
      <!-- Next page button -->
      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage === totalPages || totalPages === 0"
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        :class="currentPage === totalPages || totalPages === 0
          ? 'text-[#737373] cursor-not-allowed' 
          : 'text-[#D9D9D9] hover:bg-[#333333]'"
      >
        <ChevronRight :size="16" />
      </button>
      
      <!-- Last page button -->
      <button 
        @click="changePage(totalPages)" 
        :disabled="currentPage === totalPages || totalPages === 0"
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        :class="currentPage === totalPages || totalPages === 0
          ? 'text-[#737373] cursor-not-allowed' 
          : 'text-[#D9D9D9] hover:bg-[#333333]'"
      >
        <ChevronsRight :size="16" />
      </button>
    </div>
    
    <!-- Items per page selector -->
    <div class="ml-6 flex items-center">
      <span class="text-[#737373] text-sm mr-2">Items per page:</span>
      <select 
        v-model="selectedItemsPerPage" 
        @change="changeItemsPerPage"
        class="bg-[#232323] text-[#D9D9D9] border border-[#737373] rounded-md px-2 py-1 text-sm"
      >
        <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
    
    <!-- Stats -->
    <div class="ml-4 text-sm text-[#737373]">
      Showing {{ safeStartItem }}-{{ safeEndItem }} of {{ totalItems }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}>();

const emit = defineEmits(['page-change', 'items-per-page-change']);

const selectedItemsPerPage = ref(props.itemsPerPage);
const itemsPerPageOptions = [9, 12, 15, 24];

const safeDisplayedPageNumbers = computed(() => {
  const totalPages = Math.max(props.totalPages, 1);
  const currentPage = Math.min(Math.max(props.currentPage, 1), totalPages);
  const displayCount = 5; // max number of pages to display
  
  if (totalPages <= displayCount) {
    // if total pages < displayCount, display all pages
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  let start = Math.max(currentPage - Math.floor(displayCount / 2), 1);
  let end = start + displayCount - 1;
  
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(end - displayCount + 1, 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const safeStartItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return Math.min((props.currentPage - 1) * props.itemsPerPage + 1, props.totalItems);
});

const safeEndItem = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems);
});

const changePage = (page: number) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage || props.totalPages === 0) {
    return;
  }
  emit('page-change', page);
};

const changeItemsPerPage = () => {
  emit('items-per-page-change', selectedItemsPerPage.value);
};

watch(() => props.itemsPerPage, (newValue) => {
  selectedItemsPerPage.value = newValue;
});

watch(() => props.totalPages, (newValue) => {
  if (props.currentPage > newValue && newValue > 0) {
    emit('page-change', 1);
  }
});
</script>