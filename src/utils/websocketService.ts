import { ref } from 'vue';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: number | null = null;
  
  public isConnected = ref(false);
  public isGenerating = ref(false);
  public lastMessage = ref<any>(null);
  public connectionError = ref<string | null>(null);
  
  private eventCallbacks: { [key: string]: Array<(data: any) => void> } = {
    'event_update': [],
    'connection_established': [],
    'connection_closed': [],
    'connection_error': [],
    'generation_status': []
  };
  
  constructor(private url: string = '') {
    if (!url) {
      const isProduction = import.meta.env.PROD;
      const accessToken = localStorage.getItem('access_token');
      
      if (isProduction) {
        // Check if we're on GitHub Pages or Codespaces
        const hostname = window.location.hostname;
        
        if (hostname.includes('github.io')) {
          // GitHub Pages - use your actual Codespace URL
          this.url = 'wss://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev/ws/events/';
        } else if (hostname.includes('app.github.dev')) {
          // Direct Codespace access
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const baseHost = hostname;
          this.url = `${protocol}//${baseHost.replace('-5173.', '-8000.')}/ws/events/`;
        } else {
          // Other production domains
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host;
          this.url = `${protocol}//${host}/ws/events/`;
        }
      } else {
        // Development
        this.url = 'ws://localhost:8000/ws/events/';
      }
      
      if (accessToken) {
        this.url += `?token=${accessToken}`;
      }
    }
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    this.connectionError.value = null;
    
    try {
      const accessToken = localStorage.getItem('access_token');
      let url = this.url;
      
      // Rebuild URL with current token if needed
      if (!url.includes('?token=') && accessToken) {
        const hostname = window.location.hostname;
        let wsUrl = '';
        
        if (hostname.includes('app.github.dev')) {
          // Codespace URL
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const baseHost = hostname;
          wsUrl = `${protocol}//${baseHost.replace('-5173.', '-8000.')}/ws/events/`;
        } else {
          // Fallback
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.host;
          wsUrl = `${protocol}//${host}/ws/events/`;
        }
        
        url = `${wsUrl}?token=${accessToken}`;
      }
      
      console.log(`Connecting to WebSocket at ${url}`);
      this.socket = new WebSocket(url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionError.value = 'Failed to create WebSocket connection';
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.isConnected.value = true;
    this.connectionError.value = null;
    this.reconnectAttempts = 0;
    
    this.triggerCallbacks('connection_established', {});
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.lastMessage.value = data;
      
      if (data.type && this.eventCallbacks[data.type]) {
        this.triggerCallbacks(data.type, data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(): void {
    console.log('WebSocket disconnected');
    this.isConnected.value = false;
    this.scheduleReconnect();
    
    this.triggerCallbacks('connection_closed', {});
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.connectionError.value = 'WebSocket connection error';
    
    this.triggerCallbacks('connection_error', { error });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = window.setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectInterval);
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected.value = false;
  }

  public on(eventType: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks[eventType]) {
      this.eventCallbacks[eventType] = [];
    }
    this.eventCallbacks[eventType].push(callback);
  }

  public off(eventType: string, callback: (data: any) => void): void {
    if (this.eventCallbacks[eventType]) {
      const index = this.eventCallbacks[eventType].indexOf(callback);
      if (index > -1) {
        this.eventCallbacks[eventType].splice(index, 1);
      }
    }
  }

  private triggerCallbacks(eventType: string, data: any): void {
    if (this.eventCallbacks[eventType]) {
      this.eventCallbacks[eventType].forEach(callback => callback(data));
    }
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;