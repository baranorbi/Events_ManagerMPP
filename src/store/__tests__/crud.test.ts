import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../events';
import type { Event } from '../../types/event';

describe('Event Store CRUD Operations', () => {
  let eventStore: ReturnType<typeof useEventStore>;
  
  beforeEach(() => {
    eventStore = useEventStore();
  });
  
  describe('Create Operations', () => {
    it('should create a new event', () => {
      const initialCount = eventStore.getUserEvents().length;
      
      const newEvent: Omit<Event, 'id'> = {
        title: 'Test Event',
        description: 'This is a test event created for testing purposes',
        date: new Date('2025-05-01'),
        location: 'Test Location',
        category: 'Technology',
        isOnline: false,
        image: 'https://example.com/test-image.jpg'
      };
      
      const newEventId = eventStore.createEvent(newEvent);
      
      expect(newEventId).toBeTruthy();
      expect(typeof newEventId).toBe('string');
      
      const updatedEvents = eventStore.getUserEvents();
      expect(updatedEvents.length).toBe(initialCount + 1);
      
      const createdEvent = eventStore.getEventById(newEventId);
      expect(createdEvent).toBeTruthy();
      expect(createdEvent?.title).toBe(newEvent.title);
      expect(createdEvent?.description).toBe(newEvent.description);
      expect(createdEvent?.location).toBe(newEvent.location);
      expect(createdEvent?.category).toBe(newEvent.category);
      expect(createdEvent?.isOnline).toBe(newEvent.isOnline);
      expect(createdEvent?.image).toBe(newEvent.image);
    });
    
    it('should add the created event ID to user events array', () => {
      const userData = eventStore.getUserData();
      const initialUserEventsCount = userData.events.length;
      
      const newEvent: Omit<Event, 'id'> = {
        title: 'Another Test Event',
        description: 'This is another test event',
        date: new Date('2025-06-15'),
        location: 'Test Location 2',
        category: 'Music',
        isOnline: true
      };
      
      const newEventId = eventStore.createEvent(newEvent);
      
      const updatedUserData = eventStore.getUserData();
      expect(updatedUserData.events.length).toBe(initialUserEventsCount + 1);
      expect(updatedUserData.events).toContain(newEventId);
    });
  });
  
  describe('Read Operations', () => {
    it('should retrieve an event by ID', () => {
      const testEvent: Omit<Event, 'id'> = {
        title: 'Event for Retrieval Test',
        description: 'This event is used to test retrieval by ID',
        date: new Date('2025-07-20'),
        location: 'Test Location',
        category: 'Business',
        isOnline: false
      };
      
      const testEventId = eventStore.createEvent(testEvent);
      
      const retrievedEvent = eventStore.getEventById(testEventId);
      
      expect(retrievedEvent).toBeTruthy();
      expect(retrievedEvent?.id).toBe(testEventId);
      expect(retrievedEvent?.title).toBe(testEvent.title);
    });
    
    it('should return undefined for non-existent event ID', () => {
      const nonExistentId = 'non-existent-id-123456789';
      const event = eventStore.getEventById(nonExistentId);
      expect(event).toBeUndefined();
    });
    
    it('should retrieve all user events', () => {
      const event1: Omit<Event, 'id'> = {
        title: 'User Event 1',
        description: 'First user event',
        date: new Date('2025-08-01'),
        location: 'Location 1',
        category: 'Technology',
        isOnline: false
      };
      
      const event2: Omit<Event, 'id'> = {
        title: 'User Event 2',
        description: 'Second user event',
        date: new Date('2025-08-15'),
        location: 'Location 2',
        category: 'Design',
        isOnline: true
      };
      
      const id1 = eventStore.createEvent(event1);
      const id2 = eventStore.createEvent(event2);
      
      const userEvents = eventStore.getUserEvents();
      
      const eventIds = userEvents.map(event => event.id);
      expect(eventIds).toContain(id1);
      expect(eventIds).toContain(id2);
    });
  });
  
  describe('Update Operations', () => {
    it('should update an existing event', () => {
      // Create a test event
      const testEvent: Omit<Event, 'id'> = {
        title: 'Event to Update',
        description: 'This event will be updated',
        date: new Date('2025-09-10'),
        location: 'Original Location',
        category: 'Technology',
        isOnline: false
      };
      
      const testEventId = eventStore.createEvent(testEvent);
      
      const eventToUpdate = eventStore.getEventById(testEventId);
      if (!eventToUpdate) {
        throw new Error('Test setup failed: Event not created');
      }
      
      const updatedEventData: Event = {
        ...eventToUpdate,
        title: 'Updated Event Title',
        description: 'This event has been updated',
        location: 'New Location',
        category: 'Business',
        isOnline: true
      };
      
      const updateResult = eventStore.updateEvent(updatedEventData);
      
      expect(updateResult).toBe(true);
      
      const updatedEvent = eventStore.getEventById(testEventId);
      expect(updatedEvent?.title).toBe(updatedEventData.title);
      expect(updatedEvent?.description).toBe(updatedEventData.description);
      expect(updatedEvent?.location).toBe(updatedEventData.location);
      expect(updatedEvent?.category).toBe(updatedEventData.category);
      expect(updatedEvent?.isOnline).toBe(updatedEventData.isOnline);
    });
    
    it('should return false when trying to update a non-existent event', () => {
      const nonExistentEvent: Event = {
        id: 'non-existent-id-987654321',
        title: 'Non-existent Event',
        description: 'This event does not exist',
        date: new Date(),
        location: 'Nowhere',
        category: 'Technology'
      };
      
      const updateResult = eventStore.updateEvent(nonExistentEvent);
      expect(updateResult).toBe(false);
    });
  });
  
  describe('Delete Operations', () => {
    it('should delete an existing event', () => {
      const testEvent: Omit<Event, 'id'> = {
        title: 'Event to Delete',
        description: 'This event will be deleted',
        date: new Date('2025-10-05'),
        location: 'Delete Location',
        category: 'Art',
        isOnline: false
      };
      
      const testEventId = eventStore.createEvent(testEvent);
      
      expect(eventStore.getEventById(testEventId)).toBeTruthy();
      
      const initialUserEvents = eventStore.getUserEvents().length;
      const initialUserEventIds = eventStore.getUserData().events.length;
      
      const deleteResult = eventStore.deleteEvent(testEventId);
      
      expect(deleteResult).toBe(true);
      
      expect(eventStore.getEventById(testEventId)).toBeUndefined();
      
      expect(eventStore.getUserEvents().length).toBe(initialUserEvents - 1);
      expect(eventStore.getUserData().events.length).toBe(initialUserEventIds - 1);
      
      expect(eventStore.getUserData().events).not.toContain(testEventId);
    });
    
    it('should return false when trying to delete a non-existent event', () => {
      const nonExistentId = 'non-existent-id-555555555';
      const deleteResult = eventStore.deleteEvent(nonExistentId);
      expect(deleteResult).toBe(false);
    });
  });
  
  describe('Interested Events Operations', () => {
    it('should add an event to interested events', () => {
      const allEvents = eventStore.getAllEvents();
      const userData = eventStore.getUserData();
      
      const eventToAdd = allEvents.find(event => !userData.interestedEvents.includes(event.id));
      
      if (!eventToAdd) {
        throw new Error('Test setup failed: No event available to add to interested');
      }
      
      const initialInterestedCount = userData.interestedEvents.length;
      
      const addResult = eventStore.addToInterested(eventToAdd.id);
      
      expect(addResult).toBe(true);
      
      const updatedUserData = eventStore.getUserData();
      expect(updatedUserData.interestedEvents.length).toBe(initialInterestedCount + 1);
      expect(updatedUserData.interestedEvents).toContain(eventToAdd.id);
      
      const interestedEvents = eventStore.getInterestedEvents();
      const interestedIds = interestedEvents.map(event => event.id);
      expect(interestedIds).toContain(eventToAdd.id);
    });
    
    it('should remove an event from interested events', () => {
      const userData = eventStore.getUserData();
      
      if (userData.interestedEvents.length === 0) {
        const allEvents = eventStore.getAllEvents();
        const eventToAdd = allEvents[0];
        eventStore.addToInterested(eventToAdd.id);
      }
      
      const updatedUserData = eventStore.getUserData();
      const initialInterestedCount = updatedUserData.interestedEvents.length;
      const eventToRemove = updatedUserData.interestedEvents[0];
      
      const removeResult = eventStore.removeFromInterested(eventToRemove);
      
      expect(removeResult).toBe(true);
      
      const finalUserData = eventStore.getUserData();
      expect(finalUserData.interestedEvents.length).toBe(initialInterestedCount - 1);
      expect(finalUserData.interestedEvents).not.toContain(eventToRemove);
    });
    
    it('should not add duplicate events to interested list', () => {
      const userData = eventStore.getUserData();
      
      if (userData.interestedEvents.length === 0) {
        const allEvents = eventStore.getAllEvents();
        const eventToAdd = allEvents[0];
        eventStore.addToInterested(eventToAdd.id);
      }
      
      const updatedUserData = eventStore.getUserData();
      const initialInterestedCount = updatedUserData.interestedEvents.length;
      const alreadyInterestedEventId = updatedUserData.interestedEvents[0];
      
      const addResult = eventStore.addToInterested(alreadyInterestedEventId);
      
      expect(addResult).toBe(false);
      
      const finalUserData = eventStore.getUserData();
      expect(finalUserData.interestedEvents.length).toBe(initialInterestedCount);
    });
  });
});