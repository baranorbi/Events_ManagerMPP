import api from '../store/api';
import { ref } from 'vue';

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
  private uploadInProgress = ref(false);
  private uploadProgress = ref<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  });
  private uploadCancelled = ref(false);
  private abortController: AbortController | null = null;
  
  constructor() {}
  
  get isUploading() {
    return this.uploadInProgress;
  }
  
  get progress() {
    return this.uploadProgress;
  }
  
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
  
  public async uploadLargeFile(file: File, chunkSize = 2 * 1024 * 1024): Promise<UploadResult> {
    if (this.uploadInProgress.value) {
      throw new Error('Another upload is already in progress');
    }
    
    this.uploadInProgress.value = true;
    this.uploadProgress.value = { loaded: 0, total: file.size, percentage: 0 };
    this.uploadCancelled.value = false;
    this.abortController = new AbortController();
    
    try {
      const fileId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
        if (this.uploadCancelled.value) {
          return { success: false, error: 'Upload cancelled' };
        }
        
        const start = chunkNumber * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk, 'chunk.bin'); // Add filename to the chunk
        formData.append('filename', file.name);
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('file_id', fileId);
        
        const response = await api.post('/upload/chunked/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          signal: this.abortController.signal,
          onUploadProgress: (progressEvent) => {
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
        
        if (response.data.status === 'complete') {
          return {
            success: true,
            fileName: response.data.file_name,
            fileUrl: response.data.file_url
          };
        }
      }
      
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
  
  public cancelUpload(): void {
    if (this.uploadInProgress.value && this.abortController) {
      this.uploadCancelled.value = true;
      this.abortController.abort();
      this.uploadInProgress.value = false;
    }
  }
  
  public getDownloadUrl(fileName: string): string {
    const baseUrl = api.defaults.baseURL || '';
    return `${baseUrl}/download/${encodeURIComponent(fileName)}/`;
  }
  
  public async downloadFile(fileName: string): Promise<void> {
    try {
      const downloadUrl = this.getDownloadUrl(fileName);
      
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

const fileUploadService = new FileUploadService();
export default fileUploadService;