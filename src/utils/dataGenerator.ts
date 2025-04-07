import type { Event } from "../types/event"

export const chartDataGenerator = {
  enhanceEvents(baseEvents: Event[], additionalCount = 30): Event[] {
    const enhancedEvents = [...baseEvents]
    const categories = Array.from(new Set(baseEvents.map((e) => e.category)))
    const locations = Array.from(new Set(baseEvents.map((e) => e.location)))

    const fallbackCategories = ["Conference", "Workshop", "Seminar", "Webinar", "Meetup", "Training"]
    const fallbackLocations = ["New York", "San Francisco", "Remote", "Chicago", "Boston", "Austin"]

    const usableCategories = categories.length > 0 ? categories : fallbackCategories
    const usableLocations = locations.length > 0 ? locations : fallbackLocations

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const endDate = new Date(today)
    endDate.setMonth(today.getMonth() + 6)

    const baseTimestamp = Date.now()

    for (let i = 0; i < additionalCount; i++) {
      const randomBase =
        baseEvents.length > 0
          ? { ...baseEvents[Math.floor(Math.random() * baseEvents.length)] }
          : { title: "Event", description: "Description" }

      const isOnline = Math.random() > 0.5
      const category = usableCategories[Math.floor(Math.random() * usableCategories.length)]

      const timeDiff = endDate.getTime() - tomorrow.getTime()
      const randomTime = Math.random() * timeDiff
      const eventDate = new Date(tomorrow.getTime() + randomTime)

      const formattedDate = eventDate.toISOString().split("T")[0]

      const uniqueId = `generated-${baseTimestamp}-${i}-${Math.floor(Math.random() * 10000)}`

      enhancedEvents.push({
        ...randomBase,
        id: uniqueId,
        title: `${category} ${Math.floor(Math.random() * 100)}`,
        description: `This is a generated ${category} event for testing purposes.`,
        category,
        date: new Date(formattedDate), // Convert string to Date object
        location: isOnline ? "Remote" : usableLocations[Math.floor(Math.random() * usableLocations.length)],
        isOnline,
      })
    }

    return enhancedEvents
  },

  enhanceTimelineData(events: Event[]): { labels: string[]; data: number[] } {
    const monthsMap = new Map<string, number>()

    const today = new Date()
    for (let i = -9; i <= 2; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthsMap.set(key, 0)
    }

    events.forEach((event) => {
      if (event.date) {
        try {
          const date = typeof event.date === "string" ? new Date(event.date) : event.date
          if (!isNaN(date.getTime())) {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            if (monthsMap.has(key)) {
              monthsMap.set(key, (monthsMap.get(key) || 0) + 1)
            }
          }
        } catch (e) {
          console.error("Error parsing date:", event.date, e)
        }
      }
    })

    let baseTrend = 3
    const enhancedMonthsMap = new Map<string, number>()

    const sortedMonths = Array.from(monthsMap.keys()).sort()

    sortedMonths.forEach((month) => {
      const actualCount = monthsMap.get(month) || 0

      baseTrend += (Math.random() - 0.4) * 0.8
      baseTrend = Math.max(1, baseTrend)

      const monthNum = Number.parseInt(month.split("-")[1])
      let seasonality = 0
      if ([3, 4, 5, 9, 10, 11].includes(monthNum)) {
        seasonality = 2
      } else if ([6, 7, 8].includes(monthNum)) {
        seasonality = -1
      }

      const enhancedValue =
        actualCount > 0
          ? actualCount + Math.floor(Math.random() * 2) // random variation on real data
          : Math.max(0, Math.round(baseTrend + seasonality + Math.random() * 2)) // gen data

      enhancedMonthsMap.set(month, enhancedValue)
    })

    const formattedLabels = sortedMonths.map((key) => {
      const [year, month] = key.split("-")
      return `${new Date(Number.parseInt(year), Number.parseInt(month) - 1).toLocaleDateString("default", { month: "short" })} ${year}`
    })

    return {
      labels: formattedLabels,
      data: Array.from(enhancedMonthsMap.values()),
    }
  },

  enhanceCategoryData(events: Event[], categories: string[]): number[] {
    const categoryWeights = {
      Conference: 1.2,
      Workshop: 1.5,
      Seminar: 1.0,
      Webinar: 2.0,
      Meetup: 1.3,
      Training: 0.8,
    }

    const categoryCounts = categories.map((category) => {
      const actualCount = events.filter((e) => e.category === category).length

      if (actualCount > 0) {
        return actualCount + Math.floor(Math.random() * 2)
      } else {
        const weight = categoryWeights[category as keyof typeof categoryWeights] || 1
        return Math.floor(Math.random() * 5 * weight) + 3
      }
    })

    return categoryCounts
  },

  enhanceOnlineVsOfflineData(events: Event[]): [number, number] {
    let onlineCount = 0;
    let inPersonCount = 0;
  
    events.forEach((event) => {

      const isEventOnline = 
        event.isOnline === true || 
        String(event.isOnline).toLowerCase() === 'true' || 
        Number(event.isOnline) === 1 || 
        String(event.isOnline) === '1';
      if (isEventOnline) {
        onlineCount++;
      } else {
        inPersonCount++;
      }
    });
    
    return [onlineCount, inPersonCount];
  }
}

