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
    
    <!-- Sentinel element for intersection observer -->
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
import { ref, onMounted, onUnmounted, watch, nextTick, onBeforeUpdate, onUpdated } from 'vue';

const props = defineProps<{
  loading: boolean;
  hasMore: boolean;
  distance?: number; 
  maxItems?: number;
}>();

const emit = defineEmits(['load-more', 'remove-items']);

const sentinel = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
const isComponentMounted = ref(true);

// Track if observer is active for debugging
const isObserverActive = ref(false);

// Create and connect the intersection observer
const createObserver = () => {
  if (!sentinel.value || !isComponentMounted.value) {
    console.error('Cannot create observer: sentinel is null or component is unmounted');
    return;
  }
  
  console.log('Creating intersection observer for infinite scroll');
  
  // Disconnect any existing observer
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  try {
    // Options for the observer - use more generous margins
    const options = {
      root: null, // Use the viewport
      rootMargin: `0px 0px 1000px 0px`, // Increased bottom margin to trigger earlier
      threshold: 0 // Trigger as soon as any part is visible
    };
    
    // Create new observer
    observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      
      if (!isComponentMounted.value) return;
      
      if (entry?.isIntersecting && !props.loading && props.hasMore) {
        console.log('🔍 Intersection detected, loading more content');
        emit('load-more');
      }
    }, options);
    
    // Start observing the sentinel element
    observer.observe(sentinel.value);
    isObserverActive.value = true;
    console.log('✅ Successfully observing sentinel element');
  } catch (error) {
    console.error('❌ Error creating IntersectionObserver:', error);
    isObserverActive.value = false;
  }
};

// Handle sliding window by removing items from the top when we have too many
const handleSlidingWindow = () => {
  if (!props.maxItems || !contentRef.value || !isComponentMounted.value) return;
  
  // Find all the event cards or grid items directly
  const gridSelector = '.grid';
  const gridContainer = contentRef.value.querySelector(gridSelector);
  
  if (!gridContainer) {
    console.error(`No grid container found matching selector: ${gridSelector}`);
    return;
  }
  
  const children = gridContainer.children;
  const childCount = children.length;
  
  console.log(`Sliding window check: ${childCount} items displayed vs max ${props.maxItems}`);
  
  // Only trigger removal if we have significantly more than max (avoiding frequent removals)
  if (childCount > props.maxItems * 1.5) {
    // Calculate how many to remove - aim to get back to maxItems
    const itemsToRemove = Math.floor(childCount - props.maxItems);
    
    if (itemsToRemove > 0) {
      console.log(`Sliding window: Removing ${itemsToRemove} items from the top`);
      emit('remove-items', itemsToRemove);
    }
  }
};

// Manual check for sentinel visibility - much more aggressive than IntersectionObserver
const checkSentinelVisibility = () => {
  if (!sentinel.value || !isComponentMounted.value || props.loading || !props.hasMore) return;
  
  const rect = sentinel.value.getBoundingClientRect();
  
  // Much more generous check for visibility - if it's anywhere near the viewport
  const isVisible = (
    rect.top <= (window.innerHeight + 1000) && // Element is within 1000px below viewport
    rect.bottom >= -500 && // Element is within 500px above viewport
    rect.left <= (window.innerWidth + 100) && // Element is within 100px right of viewport
    rect.right >= -100 // Element is within 100px left of viewport
  );
  
  if (isVisible) {
    console.log('⚡ Manual visibility check: Sentinel is near viewport, emitting load-more');
    emit('load-more');
  } else {
    console.log('Manual check: Sentinel not visible', {
      rectTop: rect.top,
      viewportHeight: window.innerHeight,
      difference: rect.top - window.innerHeight
    });
  }
};

// Attempt to fix disconnected observer
const ensureObserverActive = () => {
  if (!isObserverActive.value && props.hasMore && sentinel.value && !props.loading) {
    console.log('🔄 Observer inactive, reconnecting...');
    createObserver();
    
    // Schedule a visibility check after reconnection
    setTimeout(() => {
      checkSentinelVisibility();
    }, 100);
  }
};

// Initialize observer when component is mounted
onMounted(() => {
  isComponentMounted.value = true;
  
  nextTick(() => {
    console.log('Component mounted, creating observer');
    createObserver();
    
    // Set up initial check with delay to ensure DOM is ready
    setTimeout(() => {
      checkSentinelVisibility();
    }, 500);
  });
  
  // Add scroll listener as a backup with passive option for better performance
  window.addEventListener('scroll', onScroll, { passive: true });
  
  // Add resize listener to handle layout changes
  window.addEventListener('resize', onResize, { passive: true });
});

// Handle component updates
onBeforeUpdate(() => {
  // Note the current sentinel element before update
  if (sentinel.value && observer) {
    observer.unobserve(sentinel.value);
  }
});

onUpdated(() => {
  nextTick(() => {
    // If sentinel changed, reconnect observer
    if (sentinel.value && props.hasMore && !isObserverActive.value) {
      console.log('Component updated, reconnecting observer');
      createObserver();
    }
    
    // Check visibility after update
    setTimeout(() => {
      checkSentinelVisibility();
    }, 100);
  });
});

// Throttled scroll handler to improve performance
let lastScrollTime = 0;
const scrollThreshold = 100; // ms between scroll events

const onScroll = () => {
  const now = Date.now();
  
  // Skip if we've handled a scroll event recently
  if (now - lastScrollTime < scrollThreshold) return;
  
  lastScrollTime = now;
  
  // Check if observer is active on scroll
  ensureObserverActive();
  
  // Do manual visibility check as backup
  checkSentinelVisibility();
};

// Handle window resize 
const onResize = () => {
  ensureObserverActive();
  
  // After resize, check visibility with slight delay
  setTimeout(() => {
    checkSentinelVisibility();
  }, 200);
};

// Clean up on unmount
onUnmounted(() => {
  isComponentMounted.value = false;
  isObserverActive.value = false;
  
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
});

// Watch for hasMore changes
watch(() => props.hasMore, (hasMore) => {
  console.log(`hasMore changed to ${hasMore}`);
  
  nextTick(() => {
    if (hasMore) {
      if (!isObserverActive.value && sentinel.value) {
        console.log('hasMore is true, reconnecting observer');
        createObserver();
      }
      
      // Check visibility after hasMore changes
      setTimeout(() => {
        checkSentinelVisibility();
      }, 100);
    } else if (!hasMore && observer) {
      console.log('hasMore is false, disconnecting observer');
      observer.disconnect();
      observer = null;
      isObserverActive.value = false;
    }
  });
});

// Watch for loading state changes
watch(() => props.loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) {
    // Loading just completed
    console.log('⚡ Loading completed, handling post-load operations');
    
    nextTick(() => {
      // Force reconnection of observer after content loads
      ensureObserverActive();
      
      // Also do a manual check with delay to ensure new content is rendered
      setTimeout(() => {
        console.log('Performing delayed visibility check after loading');
        checkSentinelVisibility();
        handleSlidingWindow();
      }, 200);
    });
  }
});

// Watch for sentinel element changes
watch(() => sentinel.value, (newSentinel) => {
  if (newSentinel && props.hasMore && !isObserverActive.value) {
    console.log('📍 Sentinel element reference changed, reconnecting observer');
    nextTick(() => {
      createObserver();
    });
  }
});

// Setup periodic checks to ensure everything is working
let periodicCheckInterval: number | null = null;

onMounted(() => {
  // Check more frequently (every 1.5 seconds instead of 3)
  periodicCheckInterval = window.setInterval(() => {
    if (props.hasMore && !props.loading && !isObserverActive.value) {
      console.log('🔄 Periodic check: Observer inactive but more content available, reconnecting');
      createObserver();
      checkSentinelVisibility();
    }
  }, 1500);
});

onUnmounted(() => {
  if (periodicCheckInterval !== null) {
    window.clearInterval(periodicCheckInterval);
  }
});

// Expose methods for parent component
defineExpose({
  isObserverActive,
  createObserver,
  handleSlidingWindow,
  checkSentinelVisibility
});
</script>

<style scoped>
.infinite-scroll-container {
  position: relative;
}

.sentinel {
  width: 100%;
  border-radius: 4px;
  min-height: 40px; /* Increased height for better visibility */
  position: relative;
  z-index: 10;
}
</style>