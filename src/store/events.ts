import { ref, watch } from 'vue';
import api from './api';
import { useAuthStore } from './auth';
import { useOfflineStore } from './offlineStore';
import websocketService from '../utils/websocketService';
import { toApiFormat, toClientFormat } from '../utils/dataTransformUtils';
import type { Event, User } from '../types/event';

const eventsData = ref<Event[]>([]);
const userData = ref<User>({
  id: "user1",
  name: "John Doe",
  description: "Event enthusiast and organizer",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
  events: [],
  interestedEvents: [],
});

const userEvents = ref<Event[]>([]);
const interestedEvents = ref<Event[]>([]);

const categories = ["All categories", "Technology", "Music", "Design", "Business", "Food", "Art", "Personal", "Work"];

let dataInitialized = false;

export function useEventStore() {
  const authStore = useAuthStore();
  const offlineStore = useOfflineStore();

  const setupWebSocketListeners = () => {
    websocketService.on('event_update', (data) => {
      if (data.action === 'created') {
        const newEvent = toClientFormat(data.event);
        eventsData.value.push(newEvent);
      }
    });
  };

  const initializeData = async () => {
    if (dataInitialized) return;
  
    try {
      // If offline or server is down, use cached data
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Using offline data for initialization');
        eventsData.value = offlineStore.offlineData.value.events.map((event : any) => toClientFormat(event));
        
        // If user is authenticated, load user-specific offline data
        if (authStore.checkAuth()) {
          const userId = authStore.getUser()?.id;
          if (userId) {
            userEvents.value = eventsData.value.filter(event => event.createdBy === userId);
            interestedEvents.value = eventsData.value.filter(event => 
              offlineStore.offlineData.value.interested.some((i: any) => 
                i.userId === userId && i.eventId === event.id
              )
            );
            userData.value.interestedEvents = interestedEvents.value.map(event => event.id);
          }
        }
        
        dataInitialized = true;
        return;
      }
      
      const response = await api.get("/events/");
      
      eventsData.value = Array.isArray(response.data) 
        ? response.data.map(toClientFormat) 
        : (response.data.events || []).map(toClientFormat);
  
      // store in offline cache for later
      offlineStore.offlineData.value.events = Array.isArray(response.data) 
        ? response.data 
        : (response.data.events || []);
      
      // If user is authenticated, load user-specific data
      if (authStore.checkAuth()) {
        const userId = authStore.getUser()?.id;
        if (userId) {
          await loadUserEvents(userId);
          await loadInterestedEvents(userId);
        }
      }
  
      setupWebSocketListeners();
      websocketService.connect();
      
      dataInitialized = true;
    } catch (error) {
      console.error("Failed to initialize data:", error);
      
      const offlineData = offlineStore.offlineData.value;
      if (offlineData.events && offlineData.events.length > 0) {
        eventsData.value = offlineData.events.map((event : any) => toClientFormat(event));
        dataInitialized = true;
      }
    }
  };

  const loadUserEvents = async (userId: string) => {
    try {
      // Check if offline or server is down
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Using offline data for user events');
        userEvents.value = offlineStore.offlineData.value.events
          .filter((e: any) => e.created_by === userId)
          .map((event : any) => toClientFormat(event));
        return;
      }
      
      const response = await api.get(`/users/${userId}/events/`);
      userEvents.value = response.data.map(toClientFormat);
      
      // Cache for offline use
      const userEventsCache = response.data;
      offlineStore.offlineData.value.userEvents = userEventsCache;
    } catch (error) {
      console.error("Failed to load user events:", error);
      
      const offlineData = offlineStore.offlineData.value;
      if (offlineData.userEvents) {
        userEvents.value = offlineData.userEvents.map((event : any) => toClientFormat(event));
      } else {
        userEvents.value = offlineStore.offlineData.value.events
          .filter((e: any) => e.created_by === userId)
          .map((event : any) => toClientFormat(event));
      }
    }
  };

  const refreshEvents = async () => {
    dataInitialized = false;
    
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        return false;
      }
      
      const response = await api.get("/events/");
      
      eventsData.value = Array.isArray(response.data) 
        ? response.data.map(toClientFormat) 
        : (response.data.events || []).map(toClientFormat);
      
      offlineStore.offlineData.value.events = Array.isArray(response.data) 
        ? response.data 
        : (response.data.events || []);
      
      if (authStore.checkAuth()) {
        const userId = authStore.getUser()?.id;
        if (userId) {
          await loadUserEvents(userId);
          await loadInterestedEvents(userId);
        }
      }
      
      dataInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to refresh events data:", error);
      return false;
    }
  };

  const loadInterestedEvents = async (userId: string) => {
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Using offline data for interested events');
        
        const interestedEventIds = offlineStore.offlineData.value.interested
          .filter((i: any) => i.userId === userId)
          .map((i: any) => i.eventId);
        
        interestedEvents.value = offlineStore.offlineData.value.events
          .filter((e: any) => interestedEventIds.includes(e.id))
          .map((event : any) => toClientFormat(event));
        
        userData.value.interestedEvents = interestedEventIds;
        return;
      }
      
      const response = await api.get(`/users/${userId}/interested/`);
      
      interestedEvents.value = response.data.map(toClientFormat);
  
      userData.value.interestedEvents = response.data.map((event: Event) => event.id);
      
      offlineStore.offlineData.value.interestedEvents = response.data;
      
      offlineStore.offlineData.value.interested = response.data.map((event: any) => ({
        userId,
        eventId: event.id
      }));
    } catch (error) {
      console.error("Failed to load interested events:", error);
      
      if (offlineStore.offlineData.value.interestedEvents) {
        interestedEvents.value = offlineStore.offlineData.value.interestedEvents.map((event : any) => toClientFormat(event));
        userData.value.interestedEvents = offlineStore.offlineData.value.interestedEvents.map((event: any) => event.id);
      } else {
        const interestedEventIds = offlineStore.offlineData.value.interested
          .filter((i: any) => i.userId === userId)
          .map((i: any) => i.eventId);
        
        interestedEvents.value = offlineStore.offlineData.value.events
          .filter((e: any) => interestedEventIds.includes(e.id))
          .map((event : any) => toClientFormat(event));
        
        userData.value.interestedEvents = interestedEventIds;
      }
    }
  };

  const getAllEvents = async () => {
    await initializeData();
    
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Using offline data for getAllEvents');
        return offlineStore.offlineData.value.events.map((event : any) => toClientFormat(event));
      }
      
      const response = await api.get('/events/');
      
      const events = Array.isArray(response.data) 
        ? response.data 
        : (response.data.events || []);
      
      eventsData.value = events.map(toClientFormat);
      
      offlineStore.offlineData.value.events = events;
      
      return eventsData.value;
    } catch (error) {
      console.error('Error fetching events:', error);
      
      return offlineStore.offlineData.value.events.map((event : any) => toClientFormat(event));
    }
  };

  const getUserEvents = async () => {
    await initializeData();
    
    const uniqueEventMap = new Map();
    
    userEvents.value.forEach(event => {
      const key = `${event.title}-${event.category}`;
      if (!uniqueEventMap.has(key) || 
          parseInt(event.id) > parseInt(uniqueEventMap.get(key).id)) {
        uniqueEventMap.set(key, event);
      }
    });
    
    return Array.from(uniqueEventMap.values());
  };

  const getInterestedEvents = async () => {
    await initializeData();
    return interestedEvents.value;
  };

  const getEventById = async (id: string) => {
    await initializeData();
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Using offline data for getEventById');
        const event = offlineStore.offlineData.value.events.find((e: any) => e.id === id);
        return event ? toClientFormat(event) : null;
      }
      
      const response = await api.get(`/events/${id}/`);
      
      const eventData = response.data;
      const existingEventIndex = offlineStore.offlineData.value.events
        .findIndex((e: any) => e.id === id);
      
      if (existingEventIndex !== -1) {
        offlineStore.offlineData.value.events[existingEventIndex] = eventData;
      } else {
        offlineStore.offlineData.value.events.push(eventData);
      }
      
      return toClientFormat(eventData);
    } catch (error) {
      console.error(`Failed to get event with ID ${id}:`, error);
      
      const cachedEvent = offlineStore.offlineData.value.events.find((e: any) => e.id === id);
      if (cachedEvent) {
        return toClientFormat(cachedEvent);
      }
      
      return null;
    }
  };

  const createEvent = async (eventData: any): Promise<string> => {
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Creating event offline');
        const operationId = offlineStore.queueOperation('create', 'event', toApiFormat(eventData));
        
        return `temp-${operationId}`;
      }
      
      const response = await api.post('/events/', toApiFormat(eventData));
      
      const newEvent = response.data;
      eventsData.value.push(toClientFormat(newEvent));
      
      if (authStore.checkAuth() && newEvent.created_by === authStore.getUser()?.id) {
        userEvents.value.push(toClientFormat(newEvent));
      }
      
      offlineStore.offlineData.value.events.push(newEvent);
      
      return newEvent.id;
    } catch (error) {
      console.error('Error creating event:', error);
      
      const operationId = offlineStore.queueOperation('create', 'event', toApiFormat(eventData));
      return `temp-${operationId}`;
    }
  };

  const updateEvent = async (event: Event): Promise<{ success: boolean; error?: string }> => {
    try {
      const apiEventData = toApiFormat(event);
      
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Updating event offline');
        offlineStore.queueOperation('update', 'event', apiEventData, event.id);
        return { success: true };
      }
      
      await api.patch(`/events/${event.id}/`, apiEventData);
      
      const index = eventsData.value.findIndex(e => e.id === event.id);
      if (index !== -1) {
        eventsData.value[index] = { ...eventsData.value[index], ...event };
      }
      
      const userEventIndex = userEvents.value.findIndex(e => e.id === event.id);
      if (userEventIndex !== -1) {
        userEvents.value[userEventIndex] = { ...userEvents.value[userEventIndex], ...event };
      }
      
      const interestedIndex = interestedEvents.value.findIndex(e => e.id === event.id);
      if (interestedIndex !== -1) {
        interestedEvents.value[interestedIndex] = { ...interestedEvents.value[interestedIndex], ...event };
      }
      
      const offlineIndex = offlineStore.offlineData.value.events.findIndex((e: any) => e.id === event.id);
      if (offlineIndex !== -1) {
        offlineStore.offlineData.value.events[offlineIndex] = {
          ...offlineStore.offlineData.value.events[offlineIndex],
          ...apiEventData
        };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error);
      
      offlineStore.queueOperation('update', 'event', toApiFormat(event), event.id);
      
      return { 
        success: true, 
        error: 'Changes saved locally and will sync when online'
      };
    }
  };

  const deleteEvent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Deleting event offline');
        offlineStore.queueOperation('delete', 'event', null, id);
        
        eventsData.value = eventsData.value.filter(e => e.id !== id);
        userEvents.value = userEvents.value.filter(e => e.id !== id);
        interestedEvents.value = interestedEvents.value.filter(e => e.id !== id);
        
        return { success: true };
      }
      
      await api.delete(`/events/${id}/`);
      
      eventsData.value = eventsData.value.filter(e => e.id !== id);
      userEvents.value = userEvents.value.filter(e => e.id !== id);
      interestedEvents.value = interestedEvents.value.filter(e => e.id !== id);
      
      offlineStore.offlineData.value.events = offlineStore.offlineData.value.events.filter((e: any) => e.id !== id);
      
      offlineStore.offlineData.value.interested = offlineStore.offlineData.value.interested.filter(
        (i: any) => i.eventId !== id
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      
      offlineStore.queueOperation('delete', 'event', null, id);
      
      eventsData.value = eventsData.value.filter(e => e.id !== id);
      userEvents.value = userEvents.value.filter(e => e.id !== id);
      interestedEvents.value = interestedEvents.value.filter(e => e.id !== id);
      
      return { 
        success: true, 
        error: 'Event deleted locally and will sync when online'
      };
    }
  };

  const addToInterested = async (id: string) => {
    if (!authStore.checkAuth()) {
      return false;
    }
    
    const userId = authStore.getUser()?.id;
    if (!userId) return false;
    
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Adding to interested offline');
        offlineStore.queueOperation('create', 'interested', { 
          userId, 
          eventId: id 
        });
        
        userData.value.interestedEvents.push(id);
        
        const event = eventsData.value.find(e => e.id === id);
        if (event && !interestedEvents.value.some(e => e.id === id)) {
          interestedEvents.value.push(event);
        }
        
        return true;
      }
      
      await api.post(`/users/${userId}/interested/`, { event_id: id });
      
      if (!userData.value.interestedEvents.includes(id)) {
        userData.value.interestedEvents.push(id);
      }
      
      const event = eventsData.value.find(e => e.id === id);
      if (event && !interestedEvents.value.some(e => e.id === id)) {
        interestedEvents.value.push(event);
      }
      
      if (!offlineStore.offlineData.value.interested) {
        offlineStore.offlineData.value.interested = [];
      }
      
      if (!offlineStore.offlineData.value.interested.some(
        (i: any) => i.userId === userId && i.eventId === id
      )) {
        offlineStore.offlineData.value.interested.push({
          userId,
          eventId: id
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to interested:', error);
      
      offlineStore.queueOperation('create', 'interested', { 
        userId, 
        eventId: id 
      });
      
      if (!userData.value.interestedEvents.includes(id)) {
        userData.value.interestedEvents.push(id);
      }
      
      const event = eventsData.value.find(e => e.id === id);
      if (event && !interestedEvents.value.some(e => e.id === id)) {
        interestedEvents.value.push(event);
      }
      
      return true;
    }
  };

  const removeFromInterested = async (id: string) => {
    if (!authStore.checkAuth()) {
      return false;
    }
    
    const userId = authStore.getUser()?.id;
    if (!userId) return false;
    
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Removing from interested offline');
        offlineStore.queueOperation('delete', 'interested', { 
          userId, 
          eventId: id 
        });
        
        userData.value.interestedEvents = userData.value.interestedEvents.filter(eventId => eventId !== id);
        interestedEvents.value = interestedEvents.value.filter(e => e.id !== id);
        
        return true;
      }
      
      await api.delete(`/users/${userId}/interested/${id}/`);
      
      userData.value.interestedEvents = userData.value.interestedEvents.filter(eventId => eventId !== id);
      interestedEvents.value = interestedEvents.value.filter(e => e.id !== id);
      
      offlineStore.offlineData.value.interested = offlineStore.offlineData.value.interested.filter(
        (i: any) => !(i.userId === userId && i.eventId === id)
      );
      
      return true;
    } catch (error) {
      console.error('Error removing from interested:', error);
      
      offlineStore.queueOperation('delete', 'interested', { 
        userId, 
        eventId: id 
      });
      
      userData.value.interestedEvents = userData.value.interestedEvents.filter(eventId => eventId !== id);
      interestedEvents.value = interestedEvents.value.filter(e => e.id !== id);
      
      return true;
    }
  };

  const searchEvents = async (query: string) => {
    await initializeData();
    
    if (!query) {
      return eventsData.value;
    }
    
    const lowercaseQuery = query.toLowerCase();
    return eventsData.value.filter(event => 
      event.title.toLowerCase().includes(lowercaseQuery) || 
      event.description.toLowerCase().includes(lowercaseQuery) ||
      event.location.toLowerCase().includes(lowercaseQuery) ||
      event.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  const filterEvents = async (filters: {
    startDate?: Date
    endDate?: Date
    category?: string
    isOnline?: boolean
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    await initializeData();
    
    try {
      let filteredEvents = [...eventsData.value];
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= startDate;
        });
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate <= endDate;
        });
      }
      
      if (filters.category && filters.category !== 'All categories') {
        filteredEvents = filteredEvents.filter(event => 
          event.category === filters.category
        );
      }
      
      if (filters.isOnline !== undefined) {
        filteredEvents = filteredEvents.filter(event => 
          event.isOnline === filters.isOnline
        );
      }
      
      if (filters.search) {
        const lowercaseSearch = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(event => 
          event.title.toLowerCase().includes(lowercaseSearch) || 
          event.description.toLowerCase().includes(lowercaseSearch) ||
          event.location.toLowerCase().includes(lowercaseSearch) ||
          event.category.toLowerCase().includes(lowercaseSearch)
        );
      }
      
      if (filters.sortBy) {
        filteredEvents.sort((a, b) => {
          let valueA, valueB;
          
          switch (filters.sortBy) {
            case 'date':
              valueA = new Date(a.date).getTime();
              valueB = new Date(b.date).getTime();
              break;
            case 'title':
              valueA = a.title.toLowerCase();
              valueB = b.title.toLowerCase();
              break;
            case 'category':
              valueA = a.category.toLowerCase();
              valueB = b.category.toLowerCase();
              break;
            case 'location':
              valueA = a.location.toLowerCase();
              valueB = b.location.toLowerCase();
              break;
            default:
              valueA = a[filters.sortBy as keyof Event];
              valueB = b[filters.sortBy as keyof Event];
          }
          
          if (filters.sortOrder === 'asc') {
            if (valueA === undefined) return valueB === undefined ? 0 : 1;
            if (valueB === undefined) return -1;
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
          } else {
            if (valueA === undefined) return valueB === undefined ? 0 : -1;
            if (valueB === undefined) return 1;
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
          }
        });
      }
      
      return filteredEvents;
    } catch (error) {
      console.error('Error filtering events:', error);
      return [];
    }
  };

  const getUserData = async () => {
    await initializeData();

    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        return userData.value;
      }
      
      const userId = authStore.getUser()?.id;
      if (!userId) return userData.value;
      
      const response = await api.get(`/users/${userId}/`);
      const user = response.data;
      
      userData.value = {
        ...userData.value,
        id: user.id,
        name: user.name,
        description: user.description,
        avatar: user.avatar
      };
      
      offlineStore.offlineData.value.users[userId] = user;
      
      return userData.value;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return userData.value;
    }
  };

  const updateUserData = async (data: Partial<User>) => {
    if (!authStore.checkAuth()) {
      return false;
    }
    
    const userId = authStore.getUser()?.id;
    if (!userId) return false;
    
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        offlineStore.queueOperation('update', 'user', data, userId);
        
        userData.value = { ...userData.value, ...data };
        
        return true;
      }
      
      await api.patch(`/users/${userId}/`, data);
      
      userData.value = { ...userData.value, ...data };
      
      if (offlineStore.offlineData.value.users[userId]) {
        offlineStore.offlineData.value.users[userId] = {
          ...offlineStore.offlineData.value.users[userId],
          ...data
        };
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      
      offlineStore.queueOperation('update', 'user', data, userId);
      
      userData.value = { ...userData.value, ...data };
      
      return true;
    }
  };

  const getCategories = () => {
    return categories;
  };

  const getRandomEvent = async () => {
    const allEvents = await getAllEvents();
    const randomIndex = Math.floor(Math.random() * allEvents.length);
    return allEvents[randomIndex];
  };

  const saveUploadedImage = async (file: File): Promise<string> => {
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        const tempUrl = URL.createObjectURL(file);
        return tempUrl;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.file_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return URL.createObjectURL(file);
    }
  };

  const getEventsPaginated = async (page: number, pageSize: number, filters?: any, signal?: AbortSignal) => {
    try {
      if (offlineStore.connectionStatus.value !== 'online') {
        console.log('Loading paginated events from offline cache');
        
        const cachedEvents = offlineStore.offlineData.value.events || [];
        
        let filteredEvents = [...cachedEvents];
        
        if (filters) {
          if (filters.category && filters.category !== 'All categories') {
            filteredEvents = filteredEvents.filter(event => 
              event.category === filters.category || event.category === filters.category
            );
          }
          
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredEvents = filteredEvents.filter(event => 
              event.title?.toLowerCase().includes(searchLower) ||
              event.description?.toLowerCase().includes(searchLower) ||
              event.location?.toLowerCase().includes(searchLower) ||
              event.category?.toLowerCase().includes(searchLower)
            );
          }
          
          if (filters.isOnline !== undefined && filters.isOnline !== null) {
            filteredEvents = filteredEvents.filter(event => 
              event.is_online === filters.isOnline || event.isOnline === filters.isOnline
            );
          }
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredEvents = filteredEvents.filter(event => {
              const eventDate = new Date(event.date);
              return eventDate >= startDate;
            });
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filteredEvents = filteredEvents.filter(event => {
              const eventDate = new Date(event.date);
              return eventDate <= endDate;
            });
          }
        }
        
        if (filters?.sortBy) {
          const sortField = filters.sortBy;
          const sortOrder = filters.sortOrder || 'asc';
          
          filteredEvents.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];
            
            if (sortField === 'date') {
              valueA = new Date(valueA).getTime();
              valueB = new Date(valueB).getTime();
            }
            
            if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedEvents = filteredEvents.slice(start, end);
        
        const clientEvents = paginatedEvents.map(toClientFormat);
        
        return {
          events: clientEvents,
          pagination: {
            total_events: filteredEvents.length,
            total_pages: Math.ceil(filteredEvents.length / pageSize),
            current_page: page,
            page_size: pageSize,
            has_next: end < filteredEvents.length,
            has_previous: page > 1
          }
        };
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('page_size', pageSize.toString());
      queryParams.append('pagination', 'true');
      
      if (filters) {
        if (filters.startDate) queryParams.append('start_date', formatDateForApi(filters.startDate));
        if (filters.endDate) queryParams.append('end_date', formatDateForApi(filters.endDate));
        if (filters.category && filters.category !== 'All categories') queryParams.append('category', filters.category);
        if (filters.isOnline !== undefined && filters.isOnline !== null) queryParams.append('is_online', filters.isOnline.toString());
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
        if (filters.sortOrder) queryParams.append('sort_order', filters.sortOrder);
      }
      
      const response = await api.get(`/events/?${queryParams.toString()}`, { signal });
      
      if (!offlineStore.offlineData.value.events) {
        offlineStore.offlineData.value.events = [];
      }
      
      const responseEvents = response.data.events || [];
      responseEvents.forEach((event: any) => {
        const existingIndex = offlineStore.offlineData.value.events.findIndex((e: any) => e.id === event.id);
        if (existingIndex === -1) {
          offlineStore.offlineData.value.events.push(event);
        } else {
          offlineStore.offlineData.value.events[existingIndex] = event;
        }
      });
      
      const clientEvents = responseEvents.map(toClientFormat);
      
      return {
        events: clientEvents,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching paginated events:', error);
      
      if (offlineStore.connectionStatus.value === 'online') {
        console.warn('Failed to load events from API, falling back to offline cache');
        
        offlineStore.isServerReachable.value = false;
        
        return getEventsPaginated(page, pageSize, filters, signal);
      }
      
      throw error;
    }
  };
  
  const formatDateForApi = (date: Date | string): string => {
    if (typeof date === 'string') {
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return date;
      }
    }
    return date.toISOString().split('T')[0];
  };

  const toggleEventGeneration = (start: boolean): void => {
    if (start) {
      websocketService.startEventGeneration();
    } else {
      websocketService.stopEventGeneration();
    }
  };

  watch(() => offlineStore.pendingOperations.value, (operations) => {
    const unsyncedCount = operations.filter(op => !op.synced).length;
    console.log(`${unsyncedCount} unsynced operations pending`);
  });

  return {
    getAllEvents,
    getUserEvents,
    getInterestedEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    addToInterested,
    removeFromInterested,
    getUserData,
    updateUserData,
    searchEvents,
    filterEvents,
    getCategories,
    getRandomEvent,
    saveUploadedImage,
    getEventsPaginated,
    refreshEvents,
    toggleEventGeneration,
    isGeneratingEvents: websocketService.isGenerating,
    isWebSocketConnected: websocketService.isConnected
  };
}