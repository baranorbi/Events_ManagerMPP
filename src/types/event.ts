export interface Event {
    id: string;
    title: string;
    description: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    location: string;
    category: string;
    image?: string;
    createdBy?: string;
    isOnline?: boolean;
  }
  
export interface User {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    events: string[]; // IDs of events created by user
    interestedEvents: string[]; // IDs of events user is interested in
}