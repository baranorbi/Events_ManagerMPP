<template>
  <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-[#232323] rounded-lg w-full max-w-4xl mx-auto border border-[#737373]">
      <div class="p-6">
        <div class="flex items-center mb-6">
          <button 
            @click="$emit('close')"
            class="px-4 py-2 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors border border-[#737373]"
          >
            Back
          </button>
          <h2 class="text-2xl font-bold ml-4">Event Details</h2>
        </div>
        
        <!-- Validation errors -->
        <div v-if="validationErrors.length > 0" class="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-300 rounded-md">
          <p class="font-medium mb-1">Please correct the following errors:</p>
          <ul class="list-disc pl-5">
            <li v-for="(error, index) in validationErrors" :key="index" class="text-sm">{{ error }}</li>
          </ul>
        </div>
        
        <!-- Two-column layout for form and preview -->
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Left column - form -->
          <div class="flex-1 space-y-6">
            <div>
              <h3 class="text-lg mb-2">Title & Description</h3>
              <input 
                v-model="editedEvent.title"
                type="text" 
                placeholder="Event Title" 
                class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                :class="{'border-red-500': fieldErrors.title}"
              />
              <p v-if="fieldErrors.title" class="text-red-400 text-xs mt-1">{{ fieldErrors.title }}</p>
              
              <textarea
                v-model="editedEvent.description"
                placeholder="Event Description"
                rows="3"
                class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673] mt-2"
                :class="{'border-red-500': fieldErrors.description}"
              ></textarea>
              <p v-if="fieldErrors.description" class="text-red-400 text-xs mt-1">{{ fieldErrors.description }}</p>
            </div>
            
            <!-- Image Upload Section -->
            <div>
              <h3 class="text-lg mb-2">Event Image</h3>
              
              <!-- Image Source Toggle -->
              <div class="flex mb-3 bg-[#1A1A1A] rounded-md">
                <button 
                  @click="imageSource = 'url'" 
                  class="flex-1 py-2 rounded-l-md text-center text-sm"
                  :class="imageSource === 'url' ? 'bg-[#533673] text-white' : 'text-[#D9D9D9]'"
                >
                  Image URL
                </button>
                <button 
                  @click="imageSource = 'upload'" 
                  class="flex-1 py-2 rounded-r-md text-center text-sm"
                  :class="imageSource === 'upload' ? 'bg-[#533673] text-white' : 'text-[#D9D9D9]'"
                >
                  Upload Image
                </button>
              </div>
              
              <!-- URL Input -->
              <div v-if="imageSource === 'url'" class="mb-3">
                <input 
                  v-model="imageUrl"
                  type="text" 
                  placeholder="Enter image URL (https://...)" 
                  class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                  :class="{'border-red-500': invalidUrl}"
                  @input="updatePreviewUrl"
                />
                <p v-if="invalidUrl" class="text-red-400 text-xs mt-1">
                  Please enter a valid image URL
                </p>
              </div>
              
              <!-- File Upload -->
              <div v-else class="mb-3">
                <div class="w-full bg-[#232323] border border-dashed border-[#737373] rounded-md p-4 text-center"
                     :class="{'border-red-500': fieldErrors.image}">
                  <input 
                    type="file"
                    id="image-upload-edit"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileUpload"
                    ref="fileInput"
                  />
                  <label 
                    for="image-upload-edit" 
                    class="cursor-pointer flex flex-col items-center justify-center py-4"
                  >
                    <Upload class="w-8 h-8 text-[#737373] mb-2" />
                    <span class="text-[#D9D9D9]">Click to upload an image</span>
                    <span class="text-[#737373] text-sm mt-1">PNG, JPG, GIF up to 5MB</span>
                  </label>
                  <div v-if="selectedFile" class="mt-2 text-[#D9D9D9]">
                    {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                  </div>
                </div>
                <p v-if="fieldErrors.image" class="text-red-400 text-xs mt-1">{{ fieldErrors.image }}</p>
                <button 
                  v-if="selectedFile" 
                  @click="removeFile"
                  class="mt-2 px-3 py-1 bg-[#333333] rounded-md text-[#D9D9D9] text-sm hover:bg-[#444444]"
                >
                  Remove
                </button>
              </div>
              
              <button 
                v-if="isImageChanged"
                @click="revertToOriginalImage"
                class="mt-1 px-3 py-1 bg-[#333333] rounded-md text-[#D9D9D9] text-sm hover:bg-[#444444]"
              >
                Revert to Original Image
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 class="text-lg mb-2">Date</h3>
                <div class="relative">
                  <input 
                    v-model="dateString"
                    type="text" 
                    placeholder="mm/dd/yyyy"
                    class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                    :class="{'border-red-500': fieldErrors.date}"
                    @focus="showDatePicker = true"
                    @blur="hideDatePicker"
                  />
                  <Calendar class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="20" />
                </div>
                <p v-if="fieldErrors.date" class="text-red-400 text-xs mt-1">{{ fieldErrors.date }}</p>
                
                <div v-if="showDatePicker" class="absolute z-10 mt-1 bg-[#232323] border border-[#737373] rounded-md p-4">
                  <div class="grid grid-cols-7 gap-1">
                    <div v-for="day in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="day" class="text-center text-xs text-[#737373] p-1">
                      {{ day }}
                    </div>
                    <button 
                      v-for="date in calendarDates" 
                      :key="date.getTime()" 
                      @click="selectDate(date)"
                      class="p-2 text-center text-sm rounded-md hover:bg-[#333333]"
                      :class="{ 
                        'bg-[#533673] text-white': isSelectedDate(date), 
                        'text-[#D9D9D9]': !isSelectedDate(date) && isCurrentMonth(date) && !isPastDate(date),
                        'text-[#737373]': !isCurrentMonth(date) || isPastDate(date),
                        'opacity-50 cursor-not-allowed': isPastDate(date) && !isTodayDate(date)
                      }"
                      :disabled="isPastDate(date) && !isTodayDate(date)"
                    >
                      {{ date.getDate() }}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 class="text-lg mb-2">Time</h3>
                <div class="grid grid-cols-2 gap-2">
                  <div class="relative">
                    <input 
                      v-model="editedEvent.startTime"
                      type="text" 
                      placeholder="Start"
                      class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                      :class="{'border-red-500': fieldErrors.startTime}"
                    />
                    <Clock class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="16" />
                  </div>
                  <div class="relative">
                    <input 
                      v-model="editedEvent.endTime"
                      type="text" 
                      placeholder="End"
                      class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                      :class="{'border-red-500': fieldErrors.endTime}"
                    />
                    <Clock class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="16" />
                  </div>
                </div>
                <div class="flex gap-6 mt-1">
                  <p v-if="fieldErrors.startTime" class="text-red-400 text-xs">{{ fieldErrors.startTime }}</p>
                  <p v-if="fieldErrors.endTime" class="text-red-400 text-xs">{{ fieldErrors.endTime }}</p>
                </div>
                <p class="text-[#737373] text-xs mt-1">Time fields are optional. Format as "1:00 PM" or "13:00"</p>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg mb-2">Location</h3>
              <div class="relative">
                <input 
                  v-model="editedEvent.location"
                  type="text" 
                  placeholder="Add Location" 
                  class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673]"
                  :class="{'border-red-500': fieldErrors.location}"
                />
                <Map class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="20" />
              </div>
              <p v-if="fieldErrors.location" class="text-red-400 text-xs mt-1">{{ fieldErrors.location }}</p>
            </div>
            
            <div>
              <h3 class="text-lg mb-2">Category</h3>
              <div class="relative">
                <select
                  v-model="editedEvent.category"
                  class="w-full bg-[#232323] border border-[#737373] rounded-md py-3 px-4 text-[#D9D9D9] focus:outline-none focus:ring-1 focus:ring-[#533673] appearance-none"
                  :class="{'border-red-500': fieldErrors.category}"
                >
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#737373]" :size="20" />
              </div>
              <p v-if="fieldErrors.category" class="text-red-400 text-xs mt-1">{{ fieldErrors.category }}</p>
            </div>
            
            <div>
              <div class="flex items-center">
                <input 
                  id="editIsOnline" 
                  v-model="editedEvent.isOnline" 
                  type="checkbox" 
                  class="w-4 h-4 bg-[#232323] border-[#737373] rounded focus:ring-[#533673]"
                />
                <label for="editIsOnline" class="ml-2 text-sm text-[#737373]">This is an online event</label>
              </div>
            </div>
          </div>
          
          <!-- Right column - card preview -->
          <div class="lg:w-1/3 flex flex-col justify-center">
            <!-- Card Preview -->
            <div v-if="editedEvent.title && previewUrl">
              <div class="text-sm text-[#737373] mb-2">Card Preview</div>
              <div class="bg-[#232323] rounded-lg overflow-hidden border border-[#737373] shadow">
                <div class="h-32 overflow-hidden">
                  <img 
                    :src="previewUrl" 
                    class="w-full h-full object-cover" 
                    :alt="editedEvent.title" 
                    @error="handleImageError"
                  />
                </div>
                <div class="p-3">
                  <h3 class="font-medium text-[#D9D9D9] truncate">{{ editedEvent.title }}</h3>
                  <div class="flex items-center text-[#737373] text-xs mt-1">
                    <Calendar :size="12" class="mr-1" />
                    <span>{{ dateString || 'Date not set' }}</span>
                  </div>
                </div>
              </div>
              
              <div class="mt-3 text-xs text-center text-[#737373]">
                This is how your event will appear in the events list
              </div>
            </div>
            
            <!-- Empty state when no image/title -->
            <div v-else class="flex flex-col items-center justify-center p-6 bg-[#1A1A1A] rounded-lg border border-[#737373] text-center">
              <Image :size="48" class="text-[#737373] mb-4" />
              <p class="text-[#D9D9D9]">Add a title and image to see a preview</p>
              <p class="text-[#737373] text-xs mt-2">The card preview will show how your event appears in listings</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex border-t border-[#737373] p-6">
        <button 
          @click="$emit('close')"
          class="px-6 py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors border border-[#737373]"
        >
          Cancel
        </button>
        <button 
          @click="validateAndSaveEvent"
          class="px-6 py-3 bg-[#232323] rounded-md text-[#D9D9D9] hover:bg-[#333333] transition-colors ml-auto border border-[#737373]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Saving...' : 'Save' }}
        </button>
        <button 
          @click="confirmDelete"
          class="px-6 py-3 bg-[#533673] rounded-md text-white hover:bg-opacity-90 transition-colors ml-4"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Calendar, Map, ChevronDown, Clock, Upload, Image } from 'lucide-vue-next';
import { useEventStore } from '../store/events';
import type { Event as EventType } from '../types/event';
  
const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits(['close', 'saved', 'deleted']);
const eventStore = useEventStore();
const categories = eventStore.getCategories().filter(c => c !== 'All categories');

// Validation state
const validationErrors = ref<string[]>([]);
const fieldErrors = ref({
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  category: '',
  image: ''
});

const isSubmitting = ref(false);

const editedEvent = ref<EventType>({
  id: '',
  title: '',
  description: '',
  date: new Date(),
  startTime: '',
  endTime: '',
  location: '',
  category: '',
  isOnline: false,
  image: ''
});

const showDatePicker = ref(false);
const dateString = ref('');
const currentMonth = ref(new Date());

const fileInput = ref<HTMLInputElement | null>(null);
const imageSource = ref('url');
const imageUrl = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref('');
const originalImage = ref('');
const invalidUrl = ref(false);

const isImageChanged = computed(() => {
  return originalImage.value !== previewUrl.value && originalImage.value !== '';
});

const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay();
  
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  const dates = [];
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    const day = new Date(year, month, -startingDayOfWeek + i + 1);
    dates.push(day);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(year, month, i);
    dates.push(day);
  }
  
  const remainingDays = 42 - dates.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const day = new Date(year, month + 1, i);
    dates.push(day);
  }
  
  return dates;
});

const selectDate = (date: Date) => {
  if (!isPastDate(date) || isTodayDate(date)) {
    editedEvent.value.date = new Date(date);
    dateString.value = formatDate(date);
    showDatePicker.value = false;
    fieldErrors.value.date = '';
  }
};

const isSelectedDate = (date: Date) => {
  return date.toDateString() === editedEvent.value.date.toDateString();
};

const isCurrentMonth = (date: Date) => {
  return date.getMonth() === currentMonth.value.getMonth();
};

const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const isTodayDate = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && 
         date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

const hideDatePicker = () => {
  setTimeout(() => {
    showDatePicker.value = false;
  }, 200);
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const handleFileUpload = (e: Event) => {
  const target = e.currentTarget as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      fieldErrors.value.image = 'File size must not exceed 5MB';
      return;
    }
    
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    fieldErrors.value.image = '';
  }
};

const removeFile = () => {
  selectedFile.value = null;
  previewUrl.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const revertToOriginalImage = () => {
  imageUrl.value = originalImage.value;
  previewUrl.value = originalImage.value;
  invalidUrl.value = false;
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// time format validation
const isValidTimeFormat = (time: string): boolean => {
  if (!time) return true; // empty is valid (optional field)
  
  // formats like "1:00 PM", "13:00", "1:00pm", "1:00 pm"
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(?:AM|PM|am|pm)$|^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// validate all fields
const validateForm = (): boolean => {
  validationErrors.value = [];
  
  // reset field errors
  Object.keys(fieldErrors.value).forEach(key => {
    fieldErrors.value[key as keyof typeof fieldErrors.value] = '';
  });
  
  // required fields
  if (!editedEvent.value.title.trim()) {
    fieldErrors.value.title = 'Event title is required';
    validationErrors.value.push('Event title is required');
  } else if (editedEvent.value.title.length < 3) {
    fieldErrors.value.title = 'Title must be at least 3 characters';
    validationErrors.value.push('Title must be at least 3 characters');
  }
  
  if (!editedEvent.value.description.trim()) {
    fieldErrors.value.description = 'Event description is required';
    validationErrors.value.push('Event description is required');
  } else if (editedEvent.value.description.length < 10) {
    fieldErrors.value.description = 'Description must be at least 10 characters';
    validationErrors.value.push('Description must be at least 10 characters');
  }
  
  if (!editedEvent.value.location.trim()) {
    fieldErrors.value.location = 'Event location is required';
    validationErrors.value.push('Event location is required');
  }
  
  if (!editedEvent.value.category) {
    fieldErrors.value.category = 'Please select a category';
    validationErrors.value.push('Please select a category');
  }
  
  // date validation
  if (!dateString.value) {
    fieldErrors.value.date = 'Event date is required';
    validationErrors.value.push('Event date is required');
  } else {
    try {
      const parsedDate = new Date(dateString.value);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (parsedDate < today) {
        fieldErrors.value.date = 'Event date cannot be in the past';
        validationErrors.value.push('Event date cannot be in the past');
      }
    } catch (e) {
      fieldErrors.value.date = 'Invalid date format';
      validationErrors.value.push('Invalid date format');
    }
  }
  
  // Time validation (optional)
  if (editedEvent.value.startTime && !isValidTimeFormat(editedEvent.value.startTime)) {
    fieldErrors.value.startTime = 'Invalid time format';
    validationErrors.value.push('Start time format is invalid (use HH:MM or HH:MM AM/PM)');
  }
  
  if (editedEvent.value.endTime && !isValidTimeFormat(editedEvent.value.endTime)) {
    fieldErrors.value.endTime = 'Invalid time format';
    validationErrors.value.push('End time format is invalid (use HH:MM or HH:MM AM/PM)');
  }
  
  // Image validation
  if (imageSource.value === 'url' && imageUrl.value && invalidUrl.value) {
    validationErrors.value.push('Please enter a valid image URL');
  }
  
  return validationErrors.value.length === 0;
};

onMounted(() => {
  const event = eventStore.getEventById(props.eventId);
  if (event) {
    editedEvent.value = { ...event };
    
    // handle date properly
    if (event.date instanceof Date) {
      dateString.value = formatDate(event.date);
      currentMonth.value = new Date(event.date);
    } else if (typeof event.date === 'string') {
      const parsedDate = new Date(event.date);
      editedEvent.value.date = parsedDate;
      dateString.value = formatDate(parsedDate);
      currentMonth.value = new Date(parsedDate);
    }
    
    // set up image data
    if (event.image) {
      originalImage.value = event.image;
      previewUrl.value = event.image;
      imageUrl.value = event.image;
    }
  } else {
    // handle case event is not found
    console.error('Event not found:', props.eventId);
    alert('Event not found');
    emit('close');
  }
});

const validateAndSaveEvent = async () => {
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    if (dateString.value) {
      const parsedDate = new Date(dateString.value);
      if (!isNaN(parsedDate.getTime())) {
        editedEvent.value.date = parsedDate;
      }
    }
    
    // image
    if (imageSource.value === 'upload' && selectedFile.value) {
      try {
        // "upload" the file and get the path
        const imagePath = await eventStore.saveUploadedImage(selectedFile.value);
        if (!imagePath) throw new Error('Failed to upload image');
        editedEvent.value.image = imagePath;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        validationErrors.value.push('Failed to upload image. Please try again.');
        isSubmitting.value = false;
        return;
      }
    } else if (imageSource.value === 'url' && imageUrl.value !== originalImage.value) {
      editedEvent.value.image = imageUrl.value;
    }
    
    // attempt to update the event
    if (eventStore.updateEvent(editedEvent.value)) {
      emit('saved', editedEvent.value.id);
      emit('close');
    } else {
      throw new Error('Failed to update event in store');
    }
  } catch (error) {
    console.error('Error updating event:', error);
    validationErrors.value.push(error instanceof Error ? error.message : 'Failed to update event. Please try again.');
    isSubmitting.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = () => {
  if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
    emit('deleted', props.eventId);
  }
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  console.error('Error loading image:', target.src);
  
  if (imageSource.value === 'url') {
    invalidUrl.value = true;
  }
  
  if (originalImage.value) {
    target.src = originalImage.value;
  } else {
    target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
  }
};

const updatePreviewUrl = () => {
  if (imageUrl.value && 
     (imageUrl.value.startsWith('http://') || 
      imageUrl.value.startsWith('https://') ||
      imageUrl.value.startsWith('/uploads/'))) {
    previewUrl.value = imageUrl.value;
    invalidUrl.value = false;
  } else if (imageUrl.value) {
    invalidUrl.value = true;
  } else {
    invalidUrl.value = false;
    previewUrl.value = '';
  }
};
</script>