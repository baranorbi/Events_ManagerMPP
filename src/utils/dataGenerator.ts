import { addDays, subDays, format, parseISO } from 'date-fns';
import type { Event } from '../types/event';

export const chartDataGenerator = {
  /**
   * Generates an enhanced version of your events array with more data points
   */
  enhanceEvents(baseEvents: Event[], additionalCount = 30): Event[] {
    // Use existing events as a template
    const enhancedEvents = [...baseEvents];
    const categories = Array.from(new Set(baseEvents.map(e => e.category)));
    const locations = Array.from(new Set(baseEvents.map(e => e.location)));
    
    // If we don't have enough data, use some defaults
    const fallbackCategories = ['Conference', 'Workshop', 'Seminar', 'Webinar', 'Meetup', 'Training'];
    const fallbackLocations = ['New York', 'San Francisco', 'Remote', 'Chicago', 'Boston', 'Austin'];
    
    const usableCategories = categories.length > 0 ? categories : fallbackCategories;
    const usableLocations = locations.length > 0 ? locations : fallbackLocations;
    
    // Create additional events
    for (let i = 0; i < additionalCount; i++) {
      const randomBase = baseEvents.length > 0 
        ? {...baseEvents[Math.floor(Math.random() * baseEvents.length)]} 
        : { title: 'Event', description: 'Description' };
      
      const isOnline = Math.random() > 0.5;
      const category = usableCategories[Math.floor(Math.random() * usableCategories.length)];
      
      // Generate date within last 6 months to next 3 months
      const today = new Date();
      const startDate = subDays(today, 180);  // 6 months ago
      const endDate = addDays(today, 90);     // 3 months in future
      const eventDate = this.generateWeightedDate(startDate, endDate);
      
      enhancedEvents.push({
        ...randomBase,
        id: `generated-${Date.now()}-${i}`,
        title: `${category} ${Math.floor(Math.random() * 100)}`,
        category,
        date: eventDate,
        location: isOnline ? 'Remote' : usableLocations[Math.floor(Math.random() * usableLocations.length)],
        isOnline
      });
    }
    
    return enhancedEvents;
  },
  
  /**
   * Enhances timeline data to create a more realistic trend over time
   */
  enhanceTimelineData(events: Event[]): { labels: string[], data: number[] } {
    // Get actual months from events
    const monthsMap = new Map<string, number>();
    
    // Create a 12-month range (including future months)
    const today = new Date();
    for (let i = -9; i <= 2; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, 0);
    }
    
    // Count actual events
    events.forEach(event => {
      if (event.date) {
        try {
          const date = typeof event.date === 'string' ? parseISO(event.date) : new Date(event.date);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (monthsMap.has(key)) {
            monthsMap.set(key, (monthsMap.get(key) || 0) + 1);
          }
        } catch (e) {
          console.error("Error parsing date", event.date);
        }
      }
    });
    
    // Add trend and randomization to make data more interesting
    let baseTrend = 3;
    const enhancedMonthsMap = new Map<string, number>();
    
    // Sort months chronologically
    const sortedMonths = Array.from(monthsMap.keys()).sort();
    
    sortedMonths.forEach((month, index) => {
      const actualCount = monthsMap.get(month) || 0;
      
      // Create a trending effect (gradual increase)
      baseTrend += (Math.random() - 0.4) * 0.8;
      baseTrend = Math.max(1, baseTrend);
      
      // Month of year seasonality (more events in spring/fall)
      const monthNum = parseInt(month.split('-')[1]);
      let seasonality = 0;
      if ([3, 4, 5, 9, 10, 11].includes(monthNum)) {
        seasonality = 2; // Spring/Fall boost
      } else if ([6, 7, 8].includes(monthNum)) {
        seasonality = -1; // Summer dip
      }
      
      // Combine actual data with our enhanced trend
      const enhancedValue = actualCount > 0
        ? actualCount + Math.floor(Math.random() * 2) // Small random variation on real data
        : Math.max(0, Math.round(baseTrend + seasonality + (Math.random() * 2))); // Generated data
      
      enhancedMonthsMap.set(month, enhancedValue);
    });
    
    // Format for chart display
    const formattedLabels = sortedMonths.map(key => {
      const [year, month] = key.split('-');
      return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { month: 'short' })} ${year}`;
    });
    
    return {
      labels: formattedLabels,
      data: Array.from(enhancedMonthsMap.values())
    };
  },
  
  /**
   * Enhances category data to show more balanced, realistic distribution
   */
  enhanceCategoryData(events: Event[], categories: string[]): number[] {
    const categoryWeights = {
      'Conference': 1.2,
      'Workshop': 1.5,
      'Seminar': 1.0,
      'Webinar': 2.0,
      'Meetup': 1.3,
      'Training': 0.8
    };
    
    // Count actual category distributions
    const categoryCounts = categories.map(category => {
      const actualCount = events.filter(e => e.category === category).length;
      
      if (actualCount > 0) {
        // Add small random variation to actual data
        return actualCount + Math.floor(Math.random() * 2);
      } else {
        // Generate synthetic data based on category popularity
        const weight = categoryWeights[category as keyof typeof categoryWeights] || 1;
        return Math.floor(Math.random() * 5 * weight) + 3;
      }
    });
    
    return categoryCounts;
  },
  
  /**
   * Enhances online vs in-person data
   */
  enhanceOnlineVsOfflineData(events: Event[]): [number, number] {
    let onlineCount = 0;
    let inPersonCount = 0;
    
    // Count actual events
    events.forEach(event => {
      if ('isOnline' in event && event.isOnline) {
        onlineCount++;
      } else {
        inPersonCount++;
      }
    });
    
    // If we have actual data, just add small variations
    if (onlineCount > 0 || inPersonCount > 0) {
      onlineCount += Math.floor(Math.random() * 2);
      inPersonCount += Math.floor(Math.random() * 2);
    } else {
      // Generate realistic distribution (60/40 split with variations)
      const total = 10;
      onlineCount = Math.round(total * (0.6 + (Math.random() * 0.1 - 0.05)));
      inPersonCount = total - onlineCount;
    }
    
    return [onlineCount, inPersonCount];
  },
  
  /**
   * Generate a weighted random date with more events clustered in certain periods
   */
  generateWeightedDate(startDate: Date, endDate: Date): Date {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let dayOffset;
    
    // Use a more sophisticated distribution
    if (Math.random() > 0.8) {
      // Some outlier dates (random throughout the range)
      dayOffset = Math.floor(Math.random() * totalDays);
    } else {
      // Use a triangular distribution (cluster more events in the middle)
      const r1 = Math.random();
      const r2 = Math.random();
      dayOffset = Math.floor((r1 + r2) / 2 * totalDays);
    }
    
    return addDays(startDate, dayOffset);
  }
};