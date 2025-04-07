<template>
  <div class="file-uploader">
    <!-- File Selector -->
    <div 
      v-if="!selectedFile && !isUploading"
      class="border-2 border-dashed border-[#737373] rounded-lg p-8 text-center cursor-pointer hover:border-[#533673] transition-colors"
      @click="openFileDialog"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onFileDrop"
      :class="{ 'border-[#533673] bg-[#533673] bg-opacity-10': isDragging }"
    >
      <div class="flex flex-col items-center">
        <Upload :size="48" class="text-[#737373] mb-4" />
        <h3 class="text-xl font-semibold text-[#D9D9D9] mb-2">
          {{ largeFileMode ? 'Upload Large File (Chunked)' : 'Upload File' }}
        </h3>
        <p class="text-[#737373] mb-4">
          Drag & drop your file here, or click to browse
        </p>
        <p class="text-[#737373] text-sm">
          {{ acceptedFileTypes ? `Accepted formats: ${acceptedFileTypes}` : 'All file types accepted' }} 
          {{ maxFileSize ? `(Max ${formatFileSize(maxFileSize)})` : '' }}
        </p>
        <button
          class="mt-4 px-4 py-2 bg-[#232323] text-[#D9D9D9] rounded-md hover:bg-[#333333] transition-colors"
          @click.stop="toggleUploadMode"
        >
          Switch to {{ largeFileMode ? 'Regular' : 'Large File' }} Upload
        </button>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="acceptedFileTypes"
        @change="onFileSelected"
      />
    </div>
    
    <!-- File Preview -->
    <div 
      v-else-if="selectedFile && !isUploading" 
      class="border border-[#737373] rounded-lg p-6"
    >
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center">
          <div class="mr-4">
            <FileIcon 
              v-if="!isImage" 
              :size="40" 
              class="text-[#533673]" 
            />
            <img 
              v-else 
              :src="filePreviewUrl" 
              alt="Preview" 
              class="w-16 h-16 object-cover rounded-md" 
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[#D9D9D9] break-all">{{ selectedFile.name }}</h3>
            <p class="text-[#737373] text-sm">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <button 
          @click="clearSelectedFile" 
          class="text-[#737373] hover:text-[#D9D9D9]"
        >
          <X :size="20" />
        </button>
      </div>
      
      <div class="flex space-x-3 mt-4">
        <button 
          @click="uploadFile" 
          class="px-4 py-2 bg-[#533673] text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Start Upload
        </button>
        <button 
          @click="clearSelectedFile" 
          class="px-4 py-2 bg-[#232323] text-[#D9D9D9] rounded-md hover:bg-[#333333] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
    
    <!-- Upload Progress -->
    <div 
      v-else-if="isUploading" 
      class="border border-[#737373] rounded-lg p-6"
    >
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center">
          <div class="mr-4">
            <FileIcon 
              v-if="!isImage" 
              :size="40" 
              class="text-[#533673]" 
            />
            <img 
              v-else 
              :src="filePreviewUrl" 
              alt="Preview" 
              class="w-16 h-16 object-cover rounded-md" 
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[#D9D9D9]">
              Uploading {{ selectedFile?.name }}...
            </h3>
            <p class="text-[#737373] text-sm">
              {{ formatFileSize(uploadProgress.loaded) }} of {{ formatFileSize(uploadProgress.total) }}
              ({{ uploadProgress.percentage }}%)
            </p>
          </div>
        </div>
        <button 
          @click="cancelUpload" 
          class="text-[#737373] hover:text-[#D9D9D9]"
        >
          <X :size="20" />
        </button>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-[#333333] rounded-full h-4 mb-4 overflow-hidden">
        <div 
          class="bg-[#533673] h-full" 
          :style="`width: ${uploadProgress.percentage}%`"
        ></div>
      </div>
      
      <button 
        @click="cancelUpload" 
        class="px-4 py-2 bg-[#232323] text-[#D9D9D9] rounded-md hover:bg-[#333333] transition-colors"
      >
        Cancel Upload
      </button>
    </div>
    
    <!-- Upload Results -->
    <div v-if="uploadedFiles.length > 0" class="mt-8">
      <h3 class="text-xl font-semibold text-[#D9D9D9] mb-4">Uploaded Files</h3>
      
      <div class="space-y-4">
        <div 
          v-for="file in uploadedFiles" 
          :key="file.fileUrl" 
          class="border border-[#737373] rounded-lg p-4 flex justify-between items-center"
        >
          <div class="flex items-center">
            <div class="mr-4">
              <FileIcon 
                v-if="!isFileImage(file.fileType)" 
                :size="24" 
                class="text-[#533673]" 
              />
              <Video 
                v-else-if="file.fileType?.startsWith('video/')" 
                :size="24" 
                class="text-[#533673]" 
              />
              <Image 
                v-else 
                :size="24" 
                class="text-[#533673]" 
              />
            </div>
            <div>
              <h4 class="text-[#D9D9D9] font-medium break-all">{{ file.fileName }}</h4>
              <p class="text-[#737373] text-sm">
                {{ file.fileSize ? formatFileSize(file.fileSize) : '' }}
              </p>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <a 
              :href="file.fileUrl" 
              target="_blank" 
              class="px-3 py-1 bg-[#232323] text-[#D9D9D9] rounded-md hover:bg-[#333333] transition-colors"
            >
              View
            </a>
            <button 
              @click="file.fileName && downloadFile(file.fileName)" 
              class="px-3 py-1 bg-[#533673] text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { Upload, X, File as FileIcon, Image, Video } from 'lucide-vue-next';
import fileUploadService from '../utils/fileUploadService';
import type { UploadResult } from '../utils/fileUploadService';

const props = defineProps({
  acceptedFileTypes: {
    type: String,
    default: ''
  },
  maxFileSize: {
    type: Number,
    default: 0 // 0 means no limit
  },
  initialLargeFileMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['upload-complete', 'upload-error']);

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const filePreviewUrl = ref<string>('');
const isDragging = ref(false);
const uploadedFiles = ref<UploadResult[]>([]);
const largeFileMode = ref(props.initialLargeFileMode);

const isUploading = fileUploadService.isUploading;
const uploadProgress = fileUploadService.progress;

const isImage = computed(() => {
  if (!selectedFile.value) return false;
  return selectedFile.value.type.startsWith('image/');
});

const openFileDialog = () => {
  fileInput.value?.click();
};

const onDragOver = (_: DragEvent) => {
  isDragging.value = true;
};

const onDragLeave = (_: DragEvent) => {
  isDragging.value = false;
};

const onFileDrop = (event: DragEvent) => {
  isDragging.value = false;
  
  if (!event.dataTransfer?.files.length) return;
  
  const file = event.dataTransfer.files[0];
  handleFileSelection(file);
};

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  
  if (!input.files?.length) return;
  
  const file = input.files[0];
  handleFileSelection(file);
};

const handleFileSelection = (file: File) => {
  if (props.maxFileSize > 0 && file.size > props.maxFileSize) {
    alert(`File size exceeds the maximum allowed (${formatFileSize(props.maxFileSize)})`);
    clearSelectedFile();
    return;
  }
  
  selectedFile.value = file;
  
  // preview URL for images
  if (file.type.startsWith('image/')) {
    filePreviewUrl.value = URL.createObjectURL(file);
  } else {
    filePreviewUrl.value = '';
  }
};

const clearSelectedFile = () => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
  }
  
  selectedFile.value = null;
  filePreviewUrl.value = '';
  
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;
  
  try {
    let result: UploadResult;
    
    if (largeFileMode.value) {
      result = await fileUploadService.uploadLargeFile(selectedFile.value);
    } else {
      result = await fileUploadService.uploadFile(selectedFile.value);
    }
    
    if (result.success) {
      uploadedFiles.value.push(result);
      emit('upload-complete', result);
    } else {
      emit('upload-error', result.error);
      alert(`Upload failed: ${result.error}`);
    }
    
    clearSelectedFile();
  } catch (error) {
    console.error('Error during upload:', error);
    emit('upload-error', error instanceof Error ? error.message : 'Unknown error');
    alert('An error occurred during upload');
  }
};

const cancelUpload = () => {
  fileUploadService.cancelUpload();
  clearSelectedFile();
};

const downloadFile = (fileName: string) => {
  fileUploadService.downloadFile(fileName);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const isFileImage = (fileType?: string): boolean => {
  if (!fileType) return false;
  return fileType.startsWith('image/') || fileType.startsWith('video/');
};

const toggleUploadMode = () => {
  largeFileMode.value = !largeFileMode.value;
};

onUnmounted(() => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
  }
  
  if (isUploading.value) {
    fileUploadService.cancelUpload();
  }
});
</script>