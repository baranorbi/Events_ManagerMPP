import { ref } from 'vue';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval: number = 5000; // 5 seconds
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host === 'localhost:5173' ? 'localhost:8000' : window.location.host;
      
      this.url = `ws://localhost:8000/ws/events/`;
      
      console.log(`WebSocket connecting to: ${this.url}`); // Debug log
    }
  }
  
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    this.connectionError.value = null;
    
    try {
      console.log(`Connecting to WebSocket at ${this.url}`);
      this.socket = new WebSocket(this.url);
      
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
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected.value = false;
    this.reconnectAttempts = 0;
  }
  
  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message, WebSocket is not connected');
      this.connect(); // Try to reconnect
    }
  }
  
  public startEventGeneration(): void {
    this.send({ action: 'start_generation' });
  }
  
  public stopEventGeneration(): void {
    this.send({ action: 'stop_generation' });
  }
  
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }
  
  public off(event: string, callback: (data: any) => void): void {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(cb => cb !== callback);
    }
  }
  
  private handleOpen(event: Event): void {
    console.log('WebSocket connection established');
    this.isConnected.value = true;
    this.reconnectAttempts = 0;
    this.triggerEvent('connection_established', { event });
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      this.lastMessage.value = data;
      
      // Update generation status if applicable
      if (data.type === 'generation_status') {
        this.isGenerating.value = data.status === 'started' || data.status === 'already_running';
      }
      
      // Trigger event based on message type
      if (data.type && this.eventCallbacks[data.type]) {
        this.triggerEvent(data.type, data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected.value = false;
    this.triggerEvent('connection_closed', { event });
    this.scheduleReconnect();
  }
  
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.connectionError.value = 'WebSocket connection error';
    this.triggerEvent('connection_error', { event });
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('Maximum reconnect attempts reached');
      this.connectionError.value = 'Failed to connect after multiple attempts';
    }
  }
  
  private triggerEvent(event: string, data: any): void {
    if (this.eventCallbacks[event]) {
      for (const callback of this.eventCallbacks[event]) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${event}:`, error);
        }
      }
    }
  }
}

const websocketService = new WebSocketService();

export default websocketService;