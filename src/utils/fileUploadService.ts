import axios from 'axios';
import api from '../store/api';
import { useOfflineStore } from '../store/offlineStore';
import { ref } from 'vue';

// Define interfaces
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
}

export class FileUploadService {
  // Class properties for tracking progress
  private uploadInProgress = ref(false);
  private uploadProgress = ref<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  });
  private uploadCancelled = ref(false);
  private abortController: AbortController | null = null;
  
  constructor() {}
  
  // Get reactive properties
  get isUploading() {
    return this.uploadInProgress;
  }
  
  get progress() {
    return this.uploadProgress;
  }
  
  // Method to upload a single file
  public async uploadFile(file: File): Promise<UploadResult> {
    if (this.uploadInProgress.value) {
      throw new Error('Another upload is already in progress');
    }
    
    this.uploadInProgress.value = true;
    this.uploadProgress.value = { loaded: 0, total: file.size, percentage: 0 };
    this.uploadCancelled.value = false;
    this.abortController = new AbortController();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        signal: this.abortController.signal,
        onUploadProgress: (progressEvent) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total || file.size;
          const percentage = Math.round((loaded * 100) / total);
          
          this.uploadProgress.value = { loaded, total, percentage };
        }
      });
      
      return {
        success: true,
        fileName: response.data.file_name,
        fileUrl: response.data.file_url,
        fileSize: response.data.file_size,
        fileType: response.data.file_type
      };
    } catch (error) {
      if (this.uploadCancelled.value) {
        return { success: false, error: 'Upload cancelled' };
      }
      
      console.error('Error uploading file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during upload' 
      };
    } finally {
      this.uploadInProgress.value = false;
      this.abortController = null;
    }
  }
  
  // Method to upload large files in chunks
  public async uploadLargeFile(file: File, chunkSize = 2 * 1024 * 1024): Promise<UploadResult> {
    if (this.uploadInProgress.value) {
      throw new Error('Another upload is already in progress');
    }
    
    this.uploadInProgress.value = true;
    this.uploadProgress.value = { loaded: 0, total: file.size, percentage: 0 };
    this.uploadCancelled.value = false;
    this.abortController = new AbortController();
    
    try {
      // Generate unique ID for this file upload
      const fileId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      
      // Calculate total chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      // Start uploading chunks
      for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
        // Check if upload was cancelled
        if (this.uploadCancelled.value) {
          return { success: false, error: 'Upload cancelled' };
        }
        
        // Calculate start and end bytes for this chunk
        const start = chunkNumber * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        // Create FormData for this chunk
        const formData = new FormData();
        formData.append('chunk', chunk, 'chunk.bin'); // Add filename to the chunk
        formData.append('filename', file.name);
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('file_id', fileId);
        
        // Upload this chunk - explicitly set the content type header
        const response = await api.post('/upload/chunked/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          signal: this.abortController.signal,
          onUploadProgress: (progressEvent) => {
            // Calculate overall progress including previous chunks
            const chunkLoaded = progressEvent.loaded;
            const totalLoaded = start + chunkLoaded;
            const percentage = Math.round((totalLoaded * 100) / file.size);
            
            this.uploadProgress.value = { 
              loaded: totalLoaded, 
              total: file.size, 
              percentage 
            };
          }
        });
        
        // If this was the last chunk and upload is complete, return the result
        if (response.data.status === 'complete') {
          return {
            success: true,
            fileName: response.data.file_name,
            fileUrl: response.data.file_url
          };
        }
      }
      
      // Should not reach here if upload was successful
      throw new Error('Upload process did not complete properly');
    } catch (error) {
      if (this.uploadCancelled.value) {
        return { success: false, error: 'Upload cancelled' };
      }
      
      console.error('Error uploading file in chunks:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during chunked upload' 
      };
    } finally {
      this.uploadInProgress.value = false;
      this.abortController = null;
    }
  }
  
  // Method to cancel ongoing upload
  public cancelUpload(): void {
    if (this.uploadInProgress.value && this.abortController) {
      this.uploadCancelled.value = true;
      this.abortController.abort();
      this.uploadInProgress.value = false;
    }
  }
  
  // Method to get a download URL for a file
  public getDownloadUrl(fileName: string): string {
    // Base URL is from the API settings
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/download/${encodeURIComponent(fileName)}/`;
  }
  
  // Method to download a file
  public async downloadFile(fileName: string): Promise<void> {
    try {
      const downloadUrl = this.getDownloadUrl(fileName);
      
      // Create a temporary anchor to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}

// Create singleton instance
const fileUploadService = new FileUploadService();
export default fileUploadService;