<template>
  <div class="infinite-scroll-container">
    <!-- Content being scrolled -->
    <div ref="contentRef">
      <slot></slot>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#533673]"></div>
    </div>
    
    <!-- Sentinel element for threshold detection -->
    <div 
      v-if="hasMore" 
      ref="sentinel" 
      class="sentinel h-24 my-6 bg-opacity-5"
      data-testid="infinite-scroll-sentinel"
    >
      <div class="text-xs text-center text-gray-500 py-2">Loading more...</div>
    </div>
    
    <!-- End of content message when no more items -->
    <div v-else class="py-4 text-center text-sm text-gray-500">
      No more events to load
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps<{
  loading: boolean;
  hasMore: boolean;
  maxItems?: number;
}>();

const emit = defineEmits(['load-more', 'remove-items']);

const sentinel = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isComponentMounted = ref(true);
const observer = ref<IntersectionObserver | null>(null);
const lastEmitTime = ref(0);
const emitThrottleMs = 1000; // 1 second throttle 

onMounted(() => {
  isComponentMounted.value = true;
  console.log('FixedInfiniteScroll mounted');
  
  // Add scroll listener for loading more items
  window.addEventListener('scroll', checkScrollPosition);
  window.addEventListener('resize', checkScrollPosition);
  
  // Check if we're already at the bottom of a short page
  setTimeout(() => {
    checkScrollPosition();
    checkIfNearBottom();
  }, 500);
  
  // Set up less frequent periodic checks
  const intervalId = setInterval(() => {
    if (props.hasMore && !props.loading && isComponentMounted.value) {
      checkScrollPosition();
    }
  }, 2000); // Changed from 1000 to 2000ms
  
  onUnmounted(() => {
    clearInterval(intervalId);
    window.removeEventListener('scroll', checkScrollPosition);
    window.removeEventListener('resize', checkScrollPosition);
    isComponentMounted.value = false;
  });
});

// Update the checkScrollPosition function to be less aggressive
const checkScrollPosition = () => {
  if (!sentinel.value || !isComponentMounted.value || props.loading) return;
  
  const rect = sentinel.value.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Only trigger if sentinel is within reasonable distance of viewport 
  // and we haven't triggered recently
  if (rect.top < windowHeight + 500) {
    const now = Date.now();
    if (now - lastEmitTime.value > emitThrottleMs) {
      console.log('Scroll position check: sentinel is near viewport, loading more...');
      lastEmitTime.value = now;
      emit('load-more');
    }
  }
};

const getScrollProgress = () => {
  if (!contentRef.value) return 0;
  
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Calculate how far down the page we've scrolled (0-1)
  return scrollTop / (documentHeight - windowHeight);
};

// Add an extra scroll handler
onMounted(() => {
  window.addEventListener('scroll', () => {
    if (props.hasMore && !props.loading) {
      checkScrollPosition();
      
      // If we've scrolled down significantly, emit the remove-items event
      const scrollProgress = getScrollProgress();
      if (scrollProgress > 0.5 && props.maxItems !== undefined) {
        emit('remove-items', props.maxItems / 2);
      }
    }
  }, { passive: true });
});

const checkIfNearBottom = () => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Consider "near bottom" when within 200px of the page bottom
  const isNearBottom = scrollPosition + windowHeight >= documentHeight - 200;
  
  if (isNearBottom && props.hasMore && !props.loading) {
    console.log('Near bottom of page detected, loading more...');
    emit('load-more');
  }
};

const checkSlidingWindow = () => {
  if (!props.maxItems || !contentRef.value || !isComponentMounted.value) return;
  
  // Find all event cards
  const gridSelector = '.grid';
  const gridContainer = contentRef.value.querySelector(gridSelector);
  
  if (!gridContainer) {
    console.error('No grid container found');
    return;
  }
  
  const childCount = gridContainer.children.length;
  
  // Only remove items if we have significantly more than the max
  if (childCount > props.maxItems * 1.5) {
    const itemsToRemove = Math.min(
      childCount - props.maxItems,
      Math.floor(props.maxItems / 2)
    );
    
    if (itemsToRemove > 0) {
      console.log(`Sliding window: Removing ${itemsToRemove} items from the top`);
      emit('remove-items', itemsToRemove);
    }
  }
};

// Watch for changes that require rechecking
watch(() => props.loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) {
    // Loading just completed
    console.log('Loading completed, checking for more content');
    
    nextTick(() => {
      // Check if we need to remove items
      checkSlidingWindow();
      
      // Check if we need to load more
      setTimeout(() => {
        checkScrollPosition();
      }, 200);
    });
  }
});
// Watch for hasMore changes
watch(() => props.hasMore, (hasMore) => {
  if (hasMore) {
    nextTick(() => {
      checkScrollPosition();
    });
  }
  if (hasMore && !observer.value) {
    console.log('hasMore is true but observer is null, reconnecting');
    nextTick(() => {
      createObserver();
    });
  }
});

// Add this to the script section
const forceReconnectObserver = () => {
  if (observer.value) {
    observer.value.disconnect();
  }
  
  nextTick(() => {
    createObserver();
    console.log('Observer forcefully reconnected');
    
    // Also check if we need to load more content immediately
    setTimeout(checkScrollPosition, 100);
  });
};
// Create IntersectionObserver
const createObserver = () => {
  if (sentinel.value && isComponentMounted.value) {
    observer.value = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loading) {
        emit('load-more');
      }
    }, { rootMargin: '500px' });
    
    observer.value.observe(sentinel.value);
  }
};

// Expose methods for parent component
defineExpose({
  checkScrollPosition,
  checkIfNearBottom,
  checkSlidingWindow,
  createObserver,
  forceReconnectObserver
});

</script>

<style scoped>
.infinite-scroll-container {
  position: relative;
}

.sentinel {
  width: 100%;
  border-radius: 4px;
  min-height: 40px;
  position: relative;
  z-index: 10;
}
</style>