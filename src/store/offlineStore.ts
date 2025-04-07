import { ref, watch } from 'vue';
import { useNetworkStatus } from '../utils/offlineDetector';
import api from './api';
import { v4 as uuidv4 } from 'uuid';

export type OperationType = 'create' | 'update' | 'delete';
export type ResourceType = 'event' | 'user' | 'interested';

export interface PendingOperation {
  id: string;
  timestamp: number;
  type: OperationType;
  resource: ResourceType;
  resourceId?: string;
  data?: any;
  retryCount: number;
  synced: boolean;
  syncError?: string;
}

const PENDING_OPS_KEY = 'events_manager_pending_ops';
const OFFLINE_DATA_KEY = 'events_manager_offline_data';

const loadPendingOperations = (): PendingOperation[] => {
  try {
    const stored = localStorage.getItem(PENDING_OPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load pending operations from localStorage:', e);
    return [];
  }
};

const savePendingOperations = (operations: PendingOperation[]) => {
  try {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(operations));
  } catch (e) {
    console.error('Failed to save pending operations to localStorage:', e);
  }
};

const loadOfflineData = () => {
  try {
    const stored = localStorage.getItem(OFFLINE_DATA_KEY);
    return stored ? JSON.parse(stored) : { events: [], users: {}, interested: [] };
  } catch (e) {
    console.error('Failed to load offline data from localStorage:', e);
    return { events: [], users: {}, interested: [] };
  }
};

const saveOfflineData = (data: any) => {
  try {
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save offline data to localStorage:', e);
  }
};

export function useOfflineStore() {
  const { connectionStatus, isOnline, isServerReachable, lastChecked } = useNetworkStatus();
  
  const pendingOperations = ref<PendingOperation[]>(loadPendingOperations());
  
  const offlineData = ref(loadOfflineData());
  
  const isSyncing = ref(false);
  const syncProgress = ref(0);
  const lastSyncTime = ref<Date | null>(null);
  
  watch(pendingOperations, (newValue) => {
    savePendingOperations(newValue);
  }, { deep: true });
  
  watch(offlineData, (newValue) => {
    saveOfflineData(newValue);
  }, { deep: true });
  
  const queueOperation = (
    type: OperationType,
    resource: ResourceType,
    data?: any,
    resourceId?: string
  ): string => {
    const operationId = uuidv4();
    
    const operation: PendingOperation = {
      id: operationId,
      timestamp: Date.now(),
      type,
      resource,
      resourceId,
      data,
      retryCount: 0,
      synced: false
    };
    
    pendingOperations.value.push(operation);
    
    applyOperationLocally(operation);
    
    if (connectionStatus.value === 'online') {
      syncPendingOperations();
    }
    
    return operationId;
  };
  
  const applyOperationLocally = (operation: PendingOperation) => {
    const { type, resource, resourceId, data } = operation;
    
    if (resource === 'event') {
      if (type === 'create') {
        const tempId = data.id || `temp-${uuidv4()}`;
        const event = {
          ...data,
          id: tempId,
          _offlineCreated: true
        };
        offlineData.value.events.push(event);
      } 
      else if (type === 'update' && resourceId) {
        const index = offlineData.value.events.findIndex((e: any) => e.id === resourceId);
        if (index !== -1) {
          offlineData.value.events[index] = {
            ...offlineData.value.events[index],
            ...data,
            _offlineUpdated: true
          };
        }
      } 
      else if (type === 'delete' && resourceId) {
        offlineData.value.events = offlineData.value.events.filter(
          (e: any) => e.id !== resourceId
        );
      }
    }
    else if (resource === 'user') {
      if (type === 'create') {
        const tempId = data.id || `temp-${uuidv4()}`;
        const user = {
          ...data,
          id: tempId,
          _offlineCreated: true
        };
        offlineData.value.users[tempId] = user;
      } 
      else if (type === 'update' && resourceId) {
        if (offlineData.value.users[resourceId]) {
          offlineData.value.users[resourceId] = {
            ...offlineData.value.users[resourceId],
            ...data,
            _offlineUpdated: true
          };
        }
      } 
      else if (type === 'delete' && resourceId) {
        delete offlineData.value.users[resourceId];
      }
    }
    else if (resource === 'interested') {
      if (!offlineData.value.interested) {
        offlineData.value.interested = [];
      }
      
      if (type === 'create' && data) {
        offlineData.value.interested.push({
          userId: data.userId,
          eventId: data.eventId,
          _offlineCreated: true
        });
      } 
      else if (type === 'delete' && data) {
        offlineData.value.interested = offlineData.value.interested.filter(
          (i: any) => !(i.userId === data.userId && i.eventId === data.eventId)
        );
      }
    }
  };

  const syncPendingOperations = async () => {
    if (isSyncing.value || connectionStatus.value !== 'online') {
      return;
    }
    
    isSyncing.value = true;
    syncProgress.value = 0;
    
    const unsyncedOperations = pendingOperations.value.filter(op => !op.synced);
    
    if (unsyncedOperations.length === 0) {
      isSyncing.value = false;
      return;
    }
    
    let successCount = 0;
    
    const operationsByResource: Record<string, PendingOperation[]> = {};
    
    unsyncedOperations.forEach(op => {
      const key = `${op.resource}-${op.type}`;
      if (!operationsByResource[key]) {
        operationsByResource[key] = [];
      }
      operationsByResource[key].push(op);
    });
    
    for (const [, operations] of Object.entries(operationsByResource)) {
      operations.sort((a, b) => a.timestamp - b.timestamp);
      
      for (const operation of operations) {
        try {
          const success = await syncOperation(operation);
          
          if (success) {
            operation.synced = true;
            successCount++;
          } else {
            operation.retryCount++;
          }
        } catch (error) {
          console.error('Error syncing operation:', error);
          operation.retryCount++;
          operation.syncError = error instanceof Error ? error.message : 'Unknown error';
        }
        
        syncProgress.value = Math.round((successCount / unsyncedOperations.length) * 100);
      }
    }
    
    if (successCount > 0) {
      pendingOperations.value = pendingOperations.value.filter(op => !op.synced);
    }
    
    lastSyncTime.value = new Date();
    isSyncing.value = false;
  };
  
  const syncOperation = async (operation: PendingOperation): Promise<boolean> => {
    const { type, resource, resourceId, data } = operation;
    
    try {
      if (resource === 'event') {
        if (type === 'create') {
          const response = await api.post('/events/', data);
          return response.status >= 200 && response.status < 300;
        } 
        else if (type === 'update' && resourceId) {
          const response = await api.patch(`/events/${resourceId}/`, data);
          return response.status >= 200 && response.status < 300;
        } 
        else if (type === 'delete' && resourceId) {
          const response = await api.delete(`/events/${resourceId}/`);
          return response.status >= 200 && response.status < 300;
        }
      }
      else if (resource === 'interested') {
        if (type === 'create' && data) {
          const response = await api.post(`/users/${data.userId}/interested/`, { 
            event_id: data.eventId 
          });
          return response.status >= 200 && response.status < 300;
        } 
        else if (type === 'delete' && data) {
          const response = await api.delete(`/users/${data.userId}/interested/${data.eventId}/`);
          return response.status >= 200 && response.status < 300;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error during sync operation:', error);
      return false;
    }
  };
  
  watch(connectionStatus, (newStatus) => {
    if (newStatus === 'online') {
      syncPendingOperations();
    }
  });
  
  return {
    pendingOperations,
    offlineData,
    isSyncing,
    syncProgress,
    lastSyncTime,
    connectionStatus,
    isOnline,
    isServerReachable,
    lastChecked,
    
    queueOperation,
    syncPendingOperations,
  };
}