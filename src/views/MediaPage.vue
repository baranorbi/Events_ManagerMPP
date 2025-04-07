<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-center">Media Manager</h1>
      
      <div class="grid md:grid-cols-5 gap-8">
        <!-- Sidebar with options -->
        <div class="md:col-span-2 bg-[#232323] p-6 rounded-lg border border-[#737373]">
          <h2 class="text-xl font-semibold mb-4 text-[#D9D9D9]">Upload Options</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-[#D9D9D9] mb-2">Upload Type</label>
              <div class="flex rounded-md overflow-hidden">
                <button 
                  @click="useChunkedUpload = false" 
                  class="flex-1 py-2 text-center"
                  :class="!useChunkedUpload ? 'bg-[#533673] text-white' : 'bg-[#333333] text-[#D9D9D9]'"
                >
                  Regular
                </button>
                <button 
                  @click="useChunkedUpload = true" 
                  class="flex-1 py-2 text-center"
                  :class="useChunkedUpload ? 'bg-[#533673] text-white' : 'bg-[#333333] text-[#D9D9D9]'"
                >
                  Chunked
                </button>
              </div>
              <p class="text-[#737373] text-xs mt-1">
                {{ useChunkedUpload ? 'Use chunked upload for large files (videos, etc)' : 'Regular upload for smaller files' }}
              </p>
            </div>
            
            <div>
              <label class="block text-[#D9D9D9] mb-2">File Type Filter</label>
              <select 
                v-model="fileTypeFilter" 
                class="w-full bg-[#333333] border border-[#737373] rounded-md py-2 px-3 text-[#D9D9D9]"
              >
                <option value="">All Files</option>
                <option value="image/*">Images Only</option>
                <option value="video/*">Videos Only</option>
                <option value="audio/*">Audio Only</option>
                <option value=".pdf,.doc,.docx,.txt">Documents</option>
              </select>
            </div>
            
            <div>
              <label class="block text-[#D9D9D9] mb-2">Size Limit</label>
              <select 
                v-model="sizeLimit" 
                class="w-full bg-[#333333] border border-[#737373] rounded-md py-2 px-3 text-[#D9D9D9]"
              >
                <option :value="0">No Limit</option>
                <option :value="5 * 1024 * 1024">5 MB</option>
                <option :value="20 * 1024 * 1024">20 MB</option>
                <option :value="100 * 1024 * 1024">100 MB</option>
                <option :value="500 * 1024 * 1024">500 MB</option>
              </select>
            </div>
          </div>
          
          <div class="mt-8">
            <h3 class="text-lg font-semibold mb-3 text-[#D9D9D9]">Upload Information</h3>
            <div class="space-y-2 text-[#D9D9D9] text-sm">
              <p><strong>Regular Upload:</strong> Best for files under 10MB</p>
              <p><strong>Chunked Upload:</strong> Recommended for large files like videos</p>
              <p><strong>Benefits:</strong></p>
              <ul class="list-disc pl-5 text-[#737373]">
                <li>Resume interrupted uploads</li>
                <li>Better progress tracking</li>
                <li>Lower memory usage</li>
                <li>Handles network issues</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Main uploader area -->
        <div class="md:col-span-3">
          <FileUploader 
            :accepted-file-types="fileTypeFilter"
            :max-file-size="sizeLimit" 
            :initial-large-file-mode="useChunkedUpload"
            @upload-complete="handleUploadComplete"
            @upload-error="handleUploadError"
          />
        </div>
      </div>
      
      <!-- Video Player for uploaded videos -->
      <div v-if="selectedMedia && selectedMedia.fileType?.startsWith('video/')" class="mt-12 bg-[#232323] p-6 rounded-lg border border-[#737373]">
        <h2 class="text-xl font-semibold mb-4 text-[#D9D9D9]">Video Player</h2>
        
        <div class="aspect-video bg-black rounded-lg overflow-hidden">
          <video 
            controls 
            class="w-full h-full" 
            :src="selectedMedia.fileUrl"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      
      <!-- Audio Player for uploaded audio -->
      <div v-if="selectedMedia && selectedMedia.fileType?.startsWith('audio/')" class="mt-12 bg-[#232323] p-6 rounded-lg border border-[#737373]">
        <h2 class="text-xl font-semibold mb-4 text-[#D9D9D9]">Audio Player</h2>
        
        <div class="bg-[#333333] p-4 rounded-lg">
          <audio 
            controls 
            class="w-full" 
            :src="selectedMedia.fileUrl"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import FileUploader from '../components/FileUploader.vue';
import type { UploadResult } from '../utils/fileUploadService';

const useChunkedUpload = ref(false);
const fileTypeFilter = ref('');
const sizeLimit = ref(0); // No limit by default
const selectedMedia = ref<UploadResult | null>(null);

const handleUploadComplete = (result: UploadResult) => {
  console.log('Upload complete:', result);
  
  if (result.fileType?.startsWith('video/') || 
      result.fileType?.startsWith('audio/') || 
      result.fileType?.startsWith('image/')) {
    selectedMedia.value = result;
  }
};

const handleUploadError = (error: string) => {
  console.error('Upload error:', error);
};
</script>