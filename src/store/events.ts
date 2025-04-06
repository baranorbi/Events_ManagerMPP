import { ref } from "vue"
import type { Event, User } from "../types/event"
import api from "./api"
import axios from "axios"
import { useAuthStore } from "./auth"

// Local cache of data
const eventsData = ref<Event[]>([])
const userData = ref<User>({
  id: "user1",
  name: "John Doe",
  description: "Event enthusiast and organizer",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
  events: [],
  interestedEvents: [],
})

const userEvents = ref<Event[]>([])
const interestedEvents = ref<Event[]>([])

const categories = ["All categories", "Technology", "Music", "Design", "Business", "Food", "Art", "Personal", "Work"]

// Initialize data loading
let dataInitialized = false

export function useEventStore() {
  const authStore = useAuthStore()

  // Initialize data if not already done
  const initializeData = async () => {
    if (dataInitialized) return

    try {
      // Load all events
      const response = await api.get("/events/")
      eventsData.value = response.data

      // If user is authenticated, load user-specific data
      if (authStore.checkAuth()) {
        const userId = authStore.getUser()?.id
        if (userId) {
          await loadUserEvents(userId)
          await loadInterestedEvents(userId)
        }
      }

      dataInitialized = true
    } catch (error) {
      console.error("Failed to initialize data:", error)
    }
  }

  const loadUserEvents = async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}/events/`)
      userEvents.value = response.data
    } catch (error) {
      console.error("Failed to load user events:", error)
    }
  }

  const loadInterestedEvents = async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}/interested/`)
      interestedEvents.value = response.data

      // Update user's interested events list with IDs only
      userData.value.interestedEvents = response.data.map((event: Event) => event.id)
    } catch (error) {
      console.error("Failed to load interested events:", error)
    }
  }

  const getAllEvents = async () => {
    await initializeData()
    const allEventsMap = new Map()
  
    // Add events from main data
    eventsData.value.forEach(event => {
      allEventsMap.set(event.id, event)
    })
    
    // Add user events, overriding duplicates
    userEvents.value.forEach(event => {
      allEventsMap.set(event.id, event)
    })
    
    // Convert map back to array
    return Array.from(allEventsMap.values())
  }

  const getUserEvents = async () => {
    await initializeData()
    return userEvents.value
  }

  const getInterestedEvents = async () => {
    await initializeData()
    return interestedEvents.value
  }

  const getEventById = async (id: string) => {
    await initializeData()
    try {
      const response = await api.get(`/events/${id}/`)
      return response.data
    } catch (error) {
      console.error(`Failed to get event ${id}:`, error)
      // Fallback to local cache
      return eventsData.value.find((event) => event.id === id) || userEvents.value.find((event) => event.id === id)
    }
  }

  const createEvent = async (eventData: any): Promise<string> => {
    try {
      console.log("Making API request with data:", eventData)

      // Ensure we have a properly formatted object for the API
      const formattedEventData: {
        title: any
        description: any
        category: any
        location: any
        is_online: any
        date: any
        created_by: any
        [key: string]: any // Allow additional properties
      } = {
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        location: eventData.location,
        is_online: eventData.isOnline || eventData.is_online || false,
        date: eventData.date,
        created_by: eventData.createdBy || eventData.created_by || "user1",
      }

      // Add optional fields only if they exist
      if (eventData.startTime || eventData.start_time) {
        formattedEventData.start_time = eventData.startTime || eventData.start_time
      }

      if (eventData.endTime || eventData.end_time) {
        formattedEventData.end_time = eventData.endTime || eventData.end_time
      }

      if (eventData.image) {
        formattedEventData.image = eventData.image
      }

      // Make API call to create the event
      const response = await api.post("/events/", formattedEventData)
      const newEvent = response.data

      // Convert response to match our frontend Event interface
      const formattedEvent: Event = {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date),
        location: newEvent.location,
        category: newEvent.category,
        isOnline: newEvent.is_online,
        image: newEvent.image,
        startTime: newEvent.start_time,
        endTime: newEvent.end_time,
        createdBy: newEvent.created_by,
      }

      // Update local state after successful API call
      userEvents.value.push(formattedEvent)

      return formattedEvent.id || ""
    } catch (error) {
      console.error("Failed to create event:", error)
      throw error
    }
  }

  const updateEvent = async (event: Event): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate required fields (keep your existing validation)
      if (!event.title?.trim()) {
        return { success: false, error: "Event title is required" }
      }
      if (!event.description?.trim()) {
        return { success: false, error: "Event description is required" }
      }
      if (!event.location?.trim()) {
        return { success: false, error: "Event location is required" }
      }
      if (!event.category) {
        return { success: false, error: "Event category is required" }
      }

      // Convert frontend Event to API format
      const eventData: any = {
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        is_online: event.isOnline || false,
      }

      // Handle date properly
      if (event.date) {
        if (event.date instanceof Date) {
          eventData.date = event.date.toISOString().split("T")[0] // YYYY-MM-DD format
        } else if (typeof event.date === "string") {
          const parsedDate = new Date(event.date)
          eventData.date = parsedDate.toISOString().split("T")[0]
        }
      }

      // Handle optional fields
      if (event.startTime) {
        eventData.start_time = event.startTime
      }
      if (event.endTime) {
        eventData.end_time = event.endTime
      }
      if (event.image) {
        eventData.image = event.image
      }

      console.log("Making PATCH request to update event:", event.id, eventData)

      // Make API call to update the event
      const response = await api.patch(`/events/${event.id}/`, eventData)
      const updatedEvent = response.data

      console.log("Event updated successfully:", updatedEvent)

      // Update local state after successful API call
      const index = userEvents.value.findIndex((e) => e.id === event.id)
      if (index !== -1) {
        userEvents.value[index] = { ...event }
      }

      return { success: true }
    } catch (error) {
      console.error("Error in updateEvent:", error)

      // Handle specific API errors
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          error.response.data.error || JSON.stringify(error.response.data) || `Server error: ${error.response.status}`
        return { success: false, error: errorMessage }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error updating event",
      }
    }
  }

  const deleteEvent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Make API call to delete the event
      await api.delete(`/events/${id}/`)

      // If we get here, the deletion was successful
      // Update local state by removing the event from both arrays
      const userEventsIndex = userEvents.value.findIndex((e) => e.id === id)
      if (userEventsIndex !== -1) {
        userEvents.value.splice(userEventsIndex, 1)
      }

      // Remove from userData.events list
      userData.value.events = userData.value.events.filter((eventId) => eventId !== id)

      return { success: true }
    } catch (error) {
      console.error("Error in deleteEvent:", error)

      // Check if this is a 404 that happened after a successful deletion
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Some backends return 404 when checking if the deletion worked
        // In this case, assume deletion was successful and update local state
        const userEventsIndex = userEvents.value.findIndex((e) => e.id === id)
        if (userEventsIndex !== -1) {
          userEvents.value.splice(userEventsIndex, 1)
        }

        userData.value.events = userData.value.events.filter((eventId) => eventId !== id)
        return { success: true }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete event from server",
      }
    }
  }

  const addToInterested = async (id: string) => {
    try {
      const userId = authStore.getUser()?.id
      if (!userId) return false

      // First check if the event is already in the interested list
      if (userData.value.interestedEvents.includes(id)) {
        console.log(`Event ${id} is already in interested list, skipping API call`)
        return true
      }

      await api.post(`/users/${userId}/interested/`, { event_id: id })

      // Update local cache
      userData.value.interestedEvents.push(id)

      // Add to interested events list if not already there
      const event = await getEventById(id)
      if (event && !interestedEvents.value.some((e) => e.id === id)) {
        interestedEvents.value.push(event)
      }

      return true
    } catch (error) {
      console.error(`Failed to add event ${id} to interested:`, error)
      return false
    }
  }

  const searchEvents = async (query: string) => {
    try {
      const response = await api.get("/events/", { params: { search: query } })
      return response.data
    } catch (error) {
      console.error("Failed to search events:", error)
      // Fallback to local search
      const allEvents = await getAllEvents()
      if (!query) return allEvents

      const lowerQuery = query.toLowerCase()
      return allEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(lowerQuery) ||
          event.description.toLowerCase().includes(lowerQuery) ||
          event.location.toLowerCase().includes(lowerQuery) ||
          event.category.toLowerCase().includes(lowerQuery),
      )
    }
  }

  const filterEvents = async (filters: {
    startDate?: Date
    endDate?: Date
    category?: string
    isOnline?: boolean
    search?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    try {
      // First, ensure we have all events loaded (both general and user events)
      await initializeData()
  
      // Convert filters to API format
      const apiFilters: Record<string, string | boolean> = {}
  
      if (filters.startDate) {
        apiFilters.start_date = filters.startDate.toISOString().split('T')[0]
      }
  
      if (filters.endDate) {
        apiFilters.end_date = filters.endDate.toISOString().split('T')[0]
      }
  
      if (filters.category && filters.category !== "All categories") {
        apiFilters.category = filters.category
      }
  
      if (filters.isOnline !== undefined) {
        apiFilters.is_online = filters.isOnline
      }
  
      if (filters.search) {
        apiFilters.search = filters.search
        console.log("Search query being sent to API:", filters.search)
      }
  
      // Add sorting parameters
      if (filters.sortBy) {
        apiFilters.sort_by = filters.sortBy;
        apiFilters.sort_order = filters.sortOrder || 'asc';
      }
  
      console.log("API request filters:", apiFilters)
  
      // Get filtered events from API
      const response = await api.get("/events/", { params: apiFilters })
      console.log("API response events count:", response.data.length)
      
      // Parse dates in the returned events
      return response.data.map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }))
    } catch (error) {
      console.error("Error filtering events:", error)
      
      // Implementation of fallback logic in case API fails
      // Fallback to local filtering if API fails
      const allEvents = [...eventsData.value, ...userEvents.value]
      
      // Local filtering logic
      return allEvents.filter((event) => {
        let matches = true
        
        // Filter by category
        if (filters.category && filters.category !== "All categories") {
          matches = matches && event.category === filters.category
        }
        
        // Filter by online status
        if (filters.isOnline !== undefined) {
          matches = matches && event.isOnline === filters.isOnline
        }
        
        // Filter by date range
        if (filters.startDate) {
          const eventDate = new Date(event.date)
          matches = matches && eventDate >= filters.startDate
        }
        
        if (filters.endDate) {
          const eventDate = new Date(event.date)
          matches = matches && eventDate <= filters.endDate
        }
        
        // Filter by search query
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          const titleMatches = event.title.toLowerCase().includes(searchLower)
          const descriptionMatches = event.description.toLowerCase().includes(searchLower)
          const locationMatches = event.location.toLowerCase().includes(searchLower)
          const categoryMatches = event.category.toLowerCase().includes(searchLower)
          
          matches = matches && (titleMatches || descriptionMatches || locationMatches || categoryMatches)
        }
        
        return matches
      })
    }
  }

  const removeFromInterested = async (id: string) => {
    try {
      const userId = authStore.getUser()?.id
      if (!userId) return false

      // First check if the event is actually in the interested list
      if (!userData.value.interestedEvents.includes(id)) {
        console.log(`Event ${id} is not in interested list, skipping API call`)
        return true
      }

      await api.delete(`/users/${userId}/interested/${id}/`)

      // Update local cache
      userData.value.interestedEvents = userData.value.interestedEvents.filter((eventId) => eventId !== id)

      interestedEvents.value = interestedEvents.value.filter((event) => event.id !== id)

      return true
    } catch (error) {
      console.error(`Failed to remove event ${id} from interested:`, error)
      return false
    }
  }

  const getUserData = async () => {
    await initializeData()

    try {
      const userId = authStore.getUser()?.id
      if (!userId) return userData.value

      const response = await api.get(`/users/${userId}/`)

      // Merge with local data to ensure we have all fields
      userData.value = {
        ...userData.value,
        ...response.data,
        // Keep local interested events list
        interestedEvents: userData.value.interestedEvents,
      }

      return userData.value
    } catch (error) {
      console.error("Failed to get user data:", error)
      return userData.value
    }
  }

  const updateUserData = async (data: Partial<User>) => {
    try {
      const userId = authStore.getUser()?.id
      if (!userId) return false

      const response = await api.patch(`/users/${userId}/`, data)

      // Update local cache
      userData.value = {
        ...userData.value,
        ...response.data,
      }

      return true
    } catch (error) {
      console.error("Failed to update user data:", error)
      return false
    }
  }

  const getCategories = () => {
    return categories
  }

  const getRandomEvent = async () => {
    const allEvents = await getAllEvents()
    const randomIndex = Math.floor(Math.random() * allEvents.length)
    return allEvents[randomIndex]
  }

  const saveUploadedImage = async (file: File): Promise<string> => {
    // In a real implementation, you would upload the file to the server
    // For now, we'll just create an object URL as before
    return URL.createObjectURL(file)
  }

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
  }
}

