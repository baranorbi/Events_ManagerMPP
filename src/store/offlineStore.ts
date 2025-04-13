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
    
    // Initialize collections if they don't exist
    if (!offlineData.value.events) offlineData.value.events = [];
    if (!offlineData.value.userEvents) offlineData.value.userEvents = [];
    if (!offlineData.value.interestedEvents) offlineData.value.interestedEvents = [];
    if (!offlineData.value.interested) offlineData.value.interested = [];
    if (!offlineData.value.users) offlineData.value.users = {};
    
    // Handle event operations
    if (resource === 'event') {
      if (type === 'create') {
        // Generate a temporary ID if not provided
        const tempId = data.id || `temp-${uuidv4()}`;
        
        // Create a new event with offline flag
        const event = {
          ...data,
          id: tempId,
          _offlineCreated: true
        };
        
        // Add to main events collection
        offlineData.value.events.push(event);
        
        // If this event is created by a user, also add to userEvents
        if (data.created_by) {
          offlineData.value.userEvents.push(event);
        }
      } 
      else if (type === 'update' && resourceId) {
        // Update event in main events collection
        const index = offlineData.value.events.findIndex((e: any) => e.id === resourceId);
        if (index !== -1) {
          offlineData.value.events[index] = {
            ...offlineData.value.events[index],
            ...data,
            _offlineUpdated: true
          };
        }
        
        // Also update in userEvents if present
        const userEventsIndex = offlineData.value.userEvents.findIndex(
          (e: any) => e.id === resourceId
        );
        if (userEventsIndex !== -1) {
          offlineData.value.userEvents[userEventsIndex] = {
            ...offlineData.value.userEvents[userEventsIndex],
            ...data,
            _offlineUpdated: true
          };
        }
        
        // Also update in interestedEvents if present
        const interestedEventsIndex = offlineData.value.interestedEvents.findIndex(
          (e: any) => e.id === resourceId
        );
        if (interestedEventsIndex !== -1) {
          offlineData.value.interestedEvents[interestedEventsIndex] = {
            ...offlineData.value.interestedEvents[interestedEventsIndex],
            ...data,
            _offlineUpdated: true
          };
        }
      } 
      else if (type === 'delete' && resourceId) {
        // Remove from main events collection
        offlineData.value.events = offlineData.value.events.filter(
          (e: any) => e.id !== resourceId
        );
        
        // Remove from userEvents if present
        offlineData.value.userEvents = offlineData.value.userEvents.filter(
          (e: any) => e.id !== resourceId
        );
        
        // Remove from interestedEvents if present
        offlineData.value.interestedEvents = offlineData.value.interestedEvents.filter(
          (e: any) => e.id !== resourceId
        );
        
        // Remove from interested relationships
        offlineData.value.interested = offlineData.value.interested.filter(
          (i: any) => i.eventId !== resourceId
        );
      }
    }
    // Handle user operations
    else if (resource === 'user') {
      if (type === 'create') {
        const tempId = data.id || `temp-${uuidv4()}`;
        
        offlineData.value.users[tempId] = {
          ...data,
          id: tempId,
          _offlineCreated: true
        };
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
        
        // Also clean up related user events and interested events
        offlineData.value.userEvents = offlineData.value.userEvents.filter(
          (e: any) => e.created_by !== resourceId
        );
        
        offlineData.value.interested = offlineData.value.interested.filter(
          (i: any) => i.userId !== resourceId
        );
      }
    }
    // Handle interested event operations
    else if (resource === 'interested') {
      if (type === 'create' && data) {
        // Add to interested relationships
        offlineData.value.interested.push({
          userId: data.userId,
          eventId: data.eventId,
          _offlineCreated: true
        });
        
        // Find the event and add to interestedEvents collection if not already there
        const event = offlineData.value.events.find((e: any) => e.id === data.eventId);
        if (event && !offlineData.value.interestedEvents.some((e: any) => e.id === data.eventId)) {
          offlineData.value.interestedEvents.push({
            ...event,
            _offlineInterested: true
          });
        }
      } 
      else if (type === 'delete' && data) {
        // Remove from interested relationships
        offlineData.value.interested = offlineData.value.interested.filter(
          (i: any) => !(i.userId === data.userId && i.eventId === data.eventId)
        );
        
        // Remove from interestedEvents if this was the only interested relationship for this event
        const remainingInterested = offlineData.value.interested.some(
          (i: any) => i.eventId === data.eventId
        );
        
        if (!remainingInterested) {
          offlineData.value.interestedEvents = offlineData.value.interestedEvents.filter(
            (e: any) => e.id !== data.eventId
          );
        }
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
          // Handle create operation
          const response = await api.post('/events/', data);
          
          // If successful, update any local references to this event
          if (response.data && response.data.id) {
            updateLocalReferences(operation.id, response.data.id);
          }
          
          return true;
        }
        else if (type === 'update' && resourceId) {
          // Handle update operation
          await api.patch(`/events/${resourceId}/`, data);
          return true;
        }
        else if (type === 'delete' && resourceId) {
          try {
            // Handle delete operation
            await api.delete(`/events/${resourceId}/`);
            return true;
          } catch (error : any) {
            // If the server returns 404, consider the delete operation as successful
            // because the resource doesn't exist on the server anyway
            if (error.response && error.response.status === 404) {
              console.log(`Event ${resourceId} already deleted on server or doesn't exist. Marking delete operation as synced.`);
              return true;
            }
            throw error; // Re-throw for other types of errors
          }
        }
      }
      else if (resource === 'interested') {
        // Handle interested operations (similar pattern as above)
        if (type === 'create' && data) {
          await api.post(`/users/${data.userId}/interested/`, { event_id: data.eventId });
          return true;
        }
        else if (type === 'delete' && data) {
          try {
            await api.delete(`/users/${data.userId}/interested/${data.eventId}/`);
            return true;
          } catch (error : any) {
            // If the server returns 404, consider the delete operation as successful
            if (error.response && error.response.status === 404) {
              console.log(`Interest relationship already deleted on server or doesn't exist. Marking delete operation as synced.`);
              return true;
            }
            throw error;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error during sync operation:', error);
      return false;
    }
  };
  
  // Helper function to update local references when an offline created item gets synced
  const updateLocalReferences = (tempId: string, serverId: string) => {
    if (!tempId.startsWith('temp-')) return;
    
    // Update event IDs in the events collection
    if (offlineData.value.events) {
      offlineData.value.events = offlineData.value.events.map((event: any) => {
        if (event.id === tempId) {
          return { ...event, id: serverId, _offlineCreated: false };
        }
        return event;
      });
    }
    
    // Update event IDs in the userEvents collection
    if (offlineData.value.userEvents) {
      offlineData.value.userEvents = offlineData.value.userEvents.map((event: any) => {
        if (event.id === tempId) {
          return { ...event, id: serverId, _offlineCreated: false };
        }
        return event;
      });
    }
    
    // Update event IDs in interested relationships
    if (offlineData.value.interested) {
      offlineData.value.interested = offlineData.value.interested.map((interest: any) => {
        if (interest.eventId === tempId) {
          return { ...interest, eventId: serverId };
        }
        return interest;
      });
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