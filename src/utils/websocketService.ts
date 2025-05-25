import { ref } from 'vue';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: number | null = null;
  private pollingInterval: number | null = null; // Add this property for HTTP polling
  
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
        const cloudFrontDomain = 'd1lre8oyraby8d.cloudfront.net';
        this.url = `wss://${cloudFrontDomain}/ws/events/`;
        
        // Add token to WebSocket URL if available
        if (accessToken) {
          this.url += `?token=${accessToken}`;
        }
      } else {
        this.url = `ws://localhost:8000/ws/events/`;
        
        // Add token to WebSocket URL if available
        if (accessToken) {
          this.url += `?token=${accessToken}`;
        }
      }
      
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
        // Always get a fresh token when connecting
        const accessToken = localStorage.getItem('access_token');
        let url = this.url;
        
        // If this is a reconnection, rebuild the URL with the latest token
        if (!url.includes('?token=') && accessToken) {
            // Use HTTP fallback if in production (since we can't change CloudFront)
            const baseUrl = import.meta.env.PROD
                ? `https://d1lre8oyraby8d.cloudfront.net/api/events/`
                : `ws://localhost:8000/ws/events/`;
                
            url = `${baseUrl}?token=${accessToken}`;
        }
        
        console.log(`Connecting to ${url}`);
        
        // In production, use HTTP polling instead of WebSockets
        if (import.meta.env.PROD) {
            this.initializeHttpPolling(url);
            return;
        }
        
        // Only try WebSocket in development
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
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear polling interval if it exists
    if (this.pollingInterval !== null) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
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
    this.processMessage(event.data);
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
  
  // Add HTTP polling as fallback
  private initializeHttpPolling(url: string): void {
    console.log('Using HTTP polling instead of WebSockets');
    this.isConnected.value = true;
    
    // Extract token from URL if present
    const token = url.includes('?token=') 
        ? url.split('?token=')[1] 
        : localStorage.getItem('access_token');
    
    // Create proper API URL for polling
    const apiBaseUrl = 'https://d1lre8oyraby8d.cloudfront.net/api';
    
    // Start polling every 5 seconds
    this.pollingInterval = setInterval(() => {
        fetch(`${apiBaseUrl}/events/recent`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data && data.events) {
                data.events.forEach((event: any) => {
                    this.processMessage(JSON.stringify({
                        type: 'event_update',
                        event: event,
                        action: 'updated'
                    }));
                });
            }
        })
        .catch(error => {
            console.error('Polling error:', error);
        });
    }, 5000);
}

private processMessage(messageData: string): void {
    try {
        const data = JSON.parse(messageData);
        console.log('Processing message data:', data);
        
        // Update last message
        this.lastMessage.value = data;
        
        // Trigger event based on message type
        if (data.type && this.eventCallbacks[data.type]) {
            this.triggerEvent(data.type, data);
        }
    } catch (error) {
        console.error('Error processing message data:', error);
    }
}
}

const websocketService = new WebSocketService();

export default websocketService;