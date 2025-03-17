import { ref, computed } from 'vue';
import type { Event, User } from '../types/event';

const eventsData = ref<Event[]>([
  {
    id: '1',
    title: 'Tech Conference 2025',
    description: 'Annual tech conference with industry leaders discussing the latest trends in AI, blockchain, and cloud computing. Network with professionals and attend workshops.',
    date: new Date('2025-02-15'),
    location: 'San Francisco, CA',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
    isOnline: false
  },
  { 
    id: '2', 
    title: 'Music Festival', 
    description: 'Three days of amazing live performances featuring top artists from around the world. Food vendors, art installations, and multiple stages for non-stop entertainment.', 
    date: new Date('2025-03-01'), 
    location: 'Austin, TX',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop',
    isOnline: false
  },
  { 
    id: '3', 
    title: 'Design Workshop', 
    description: 'Learn UI/UX design principles from experts in the field. Hands-on exercises, portfolio reviews, and networking opportunities with design professionals.', 
    date: new Date('2025-02-20'), 
    location: 'Online',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop',
    isOnline: true
  },
  { 
    id: '4', 
    title: 'Startup Pitch Night', 
    description: 'Entrepreneurs pitch their ideas to investors and receive feedback. Great opportunity for networking and finding potential funding for your business.', 
    date: new Date('2025-02-28'), 
    location: 'New York, NY',
    category: 'Business',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop',
    isOnline: false
  },
  { 
    id: '5', 
    title: 'Cooking Masterclass', 
    description: 'Learn to cook with a renowned chef specializing in international cuisine. Ingredients provided, and you\'ll take home recipes to recreate the dishes.', 
    date: new Date('2025-03-10'), 
    location: 'Chicago, IL',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop',
    isOnline: false
  },
  { 
    id: '6', 
    title: 'Photography Exhibition', 
    description: 'Showcasing works from emerging photographers exploring themes of urban life, nature, and human connection. Opening night includes meet and greet with artists.', 
    date: new Date('2025-03-05'), 
    location: 'Los Angeles, CA',
    category: 'Art',
    image: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?q=80&w=2070&auto=format&fit=crop',
    isOnline: false
  }
]);

const userData = ref<User>({
  id: 'user1',
  name: 'John Doe',
  description: 'Event enthusiast and organizer',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
  events: ['101', '102'],
  interestedEvents: ['2', '4', '6']
});

const userEvents = ref<Event[]>([
  { 
    id: '101', 
    title: 'Birthday Party', 
    description: 'Celebrating with friends and family. Join us for food, drinks, and fun activities to mark this special occasion.', 
    date: new Date('2025-03-15'), 
    location: 'My House',
    category: 'Personal',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2070&auto=format&fit=crop',
    createdBy: 'user1',
    isOnline: false
  },
  { 
    id: '102', 
    title: 'Team Building', 
    description: 'Company retreat for team bonding with outdoor activities, workshops, and strategy sessions to improve collaboration.', 
    date: new Date('2025-04-10'), 
    location: 'Mountain Resort',
    category: 'Work',
    image: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?q=80&w=2070&auto=format&fit=crop',
    createdBy: 'user1',
    isOnline: false
  }
]);

const categories = [
  'All categories',
  'Technology',
  'Music',
  'Design',
  'Business',
  'Food',
  'Art',
  'Personal',
  'Work'
];

const interestedEvents = computed(() => {
  return eventsData.value.filter(event => 
    userData.value.interestedEvents.includes(event.id)
  );
});

export function useEventStore() {
  const getAllEvents = () => {
    return [...eventsData.value, ...userEvents.value];
  };

  const getUserEvents = () => {
    return userEvents.value;
  };

  const getInterestedEvents = () => {
    return interestedEvents.value;
  };

  const getEventById = (id: string) => {
    return eventsData.value.find(event => event.id === id) || 
           userEvents.value.find(event => event.id === id);
  };

  const createEvent = (event: Omit<Event, 'id'>) => {
    const newId = Date.now().toString();
    const newEvent = { 
      ...event, 
      id: newId,
      createdBy: userData.value.id 
    };
    
    userEvents.value.push(newEvent);
    userData.value.events.push(newId);
    
    return newId;
  };

  const updateEvent = (event: Event) => {
    const index = userEvents.value.findIndex(e => e.id === event.id);
    if (index !== -1) {
      userEvents.value[index] = { ...event };
      return true;
    }
    return false;
  };

  const deleteEvent = (id: string) => {
    const index = userEvents.value.findIndex(e => e.id === id);
    if (index !== -1) {
      userEvents.value.splice(index, 1);
      userData.value.events = userData.value.events.filter(eventId => eventId !== id);
      return true;
    }
    return false;
  };

  const addToInterested = (id: string) => {
    if (!userData.value.interestedEvents.includes(id)) {
      userData.value.interestedEvents.push(id);
      return true;
    }
    return false;
  };

  const searchEvents = (query: string) => {
    if (!query) return getAllEvents();
    
    const lowerQuery = query.toLowerCase();
    return getAllEvents().filter(event => 
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery) ||
      event.location.toLowerCase().includes(lowerQuery) ||
      event.category.toLowerCase().includes(lowerQuery)
    );
  };

  const filterEvents = (filters: {
    startDate?: Date,
    endDate?: Date,
    category?: string,
    isOnline?: boolean
  }) => {
    return getAllEvents().filter(event => {
      if (filters.startDate && event.date < filters.startDate) return false;
      if (filters.endDate && event.date > filters.endDate) return false;
      
      if (filters.category && filters.category !== 'All categories' && event.category !== filters.category) return false;
      
      if (filters.isOnline !== undefined && event.isOnline !== filters.isOnline) return false;
      
      return true;
    });
  };

  const removeFromInterested = (id: string) => {
    userData.value.interestedEvents = userData.value.interestedEvents.filter(
      eventId => eventId !== id
    );
    return true;
  };

  const getUserData = () => {
    return userData.value;
  };

  const updateUserData = (data: Partial<User>) => {
    userData.value = { ...userData.value, ...data };
    return true;
  };

  const getCategories = () => {
    return categories;
  };

  const getRandomEvent = () => {
    const allEvents = getAllEvents();
    const randomIndex = Math.floor(Math.random() * allEvents.length);
    return allEvents[randomIndex];
  };

  const saveUploadedImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      
      console.log(`Created object URL for image: ${objectUrl}`);
      
      resolve(objectUrl);
    });
  };

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
    saveUploadedImage
  };
}