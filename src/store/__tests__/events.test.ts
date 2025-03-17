import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../events';

describe('Event Store', () => {
  let eventStore: ReturnType<typeof useEventStore>;
  
  beforeEach(() => {
    eventStore = useEventStore();
  });
  
  describe('Mock Data', () => {
    it('should have events data', () => {
      const events = eventStore.getAllEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('id');
      expect(events[0]).toHaveProperty('title');
      expect(events[0]).toHaveProperty('description');
      expect(events[0]).toHaveProperty('date');
      expect(events[0]).toHaveProperty('location');
      expect(events[0]).toHaveProperty('category');
    });
    
    it('should have categories data', () => {
      const categories = eventStore.getCategories();
      expect(categories).toContain('All categories');
      expect(categories).toContain('Technology');
      expect(categories).toContain('Music');
      expect(categories).toContain('Design');
      expect(categories).toContain('Business');
      expect(categories).toContain('Food');
      expect(categories).toContain('Art');
    });
  });
  
  describe('Filter Events', () => {
    it('should filter events by category', () => {
      const technologyEvents = eventStore.filterEvents({ category: 'Technology' });
      expect(technologyEvents.every(event => event.category === 'Technology')).toBe(true);
      
      const musicEvents = eventStore.filterEvents({ category: 'Music' });
      expect(musicEvents.every(event => event.category === 'Music')).toBe(true);
    });
    
    it('should return all events when "All categories" is selected', () => {
      const allEvents = eventStore.getAllEvents();
      const filteredEvents = eventStore.filterEvents({ category: 'All categories' });
      expect(filteredEvents.length).toBe(allEvents.length);
    });
    
    it('should filter events by isOnline property', () => {
      const onlineEvents = eventStore.filterEvents({ isOnline: true });
      expect(onlineEvents.every(event => event.isOnline === true)).toBe(true);
      
      const inPersonEvents = eventStore.filterEvents({ isOnline: false });
      expect(inPersonEvents.every(event => event.isOnline === false)).toBe(true);
    });
    
    it('should filter events by date range', () => {
      const startDate = new Date('2025-02-01');
      const endDate = new Date('2025-02-28');
      const februaryEvents = eventStore.filterEvents({ startDate, endDate });
      
      expect(februaryEvents.every(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      })).toBe(true);
    });
  });
});