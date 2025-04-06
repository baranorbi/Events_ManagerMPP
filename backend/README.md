# Event Manager API

A Django REST API for the Event Manager application with in-memory storage.

## Features

- REST API with CRUD operations for events
- In-memory data storage (no database persistence)
- Server-side validation
- Filtering and sorting capabilities
- CORS support
- Unit tests

## API Endpoints

### Events

- `GET /api/events/` - Get all events (with optional filtering and sorting)
- `POST /api/events/` - Create a new event
- `GET /api/events/{event_id}/` - Get a specific event
- `PATCH /api/events/{event_id}/` - Update a specific event
- `DELETE /api/events/{event_id}/` - Delete a specific event

### Users

- `GET /api/users/{user_id}/` - Get user details
- `PATCH /api/users/{user_id}/` - Update user details
- `GET /api/users/{user_id}/events/` - Get events created by a user
- `GET /api/users/{user_id}/interested/` - Get events a user is interested in
- `POST /api/users/{user_id}/interested/` - Add an event to user's interested list
- `DELETE /api/users/{user_id}/interested/{event_id}/` - Remove an event from user's interested list

### Authentication

- `POST /api/auth/` - Authenticate a user

## Filtering and Sorting

Events can be filtered and sorted using query parameters:

- `?start_date=YYYY-MM-DD` - Filter events starting from this date
- `?end_date=YYYY-MM-DD` - Filter events up to this date
- `?category=CategoryName` - Filter events by category
- `?is_online=true|false` - Filter events by online/offline status
- `?search=query` - Search events by title, description, location, or category
- `?sort_by=field` - Sort events by field (date, title, category)
- `?sort_order=asc|desc` - Sort order (ascending or descending)

## Setup and Running

1. Install dependencies:

