# Events Manager

A Vue 3 application for creating and managing events built with TypeScript, Vite, and Tailwind CSS, with a Django REST API backend.

## Features

- Browse and search events
- Filter events by category, date range, and location type
- Create, edit and delete events
- Manage your interested events list
- User authentication with role-based access control
- User activity monitoring and suspicious behavior detection
- Admin dashboard for security monitoring
- Responsive design
- Real-time updates via WebSockets
- Data persistence with PostgreSQL
- Optimized database queries for large datasets
- File upload capabilities with chunked uploads for large files

## Navigation

The application has several main pages:

- **Home** (`/`) - Browse all events with filtering capabilities
- **Trending** (`/trending`) - View popular events in a slideshow format
- **Charts** (`/charts`) - View event statistics and analytics
- **Profile** (`/profile`) - View your profile and interested events (requires login)
- **Manage Events** (`/manage-events`) - Create, edit and delete your events (requires login)
- **Media** (`/media`) - Upload and manage media files (requires login)
- **Admin Dashboard** (`/admin`) - View monitoring data and security information (requires admin role)
- **Sign In** (`/sign-in`) - Authentication page
- **Register** (`/register`) - User registration page

## User Roles

The application supports two user roles:

- **Regular User** - Can create, edit and delete their own events, mark events as interested
- **Admin** - Has all regular user capabilities plus access to the Admin Dashboard for monitoring suspicious user activity

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- Python 3.8+
- PostgreSQL
- Redis (for WebSocket channels)

### Frontend Setup

1. Clone the repository

2. Install dependencies
```bash
npm install
```
3. Start the development server
```bash
npm run dev
```
4. Open your browser and navigate to ```http://localhost:5173```

### Backend Setup

1. Navigate to the backend directory
```bash
cd backend
```

2. Create a virtual environment and activate it
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On MacOS/Linux
source venv/bin/activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Configure PostgreSQL
   - Create a PostgreSQL database
   - Update the database settings in ```settings.py``` with your credentials

5. Apply migrations
```bash
python manage.py migrate
```

6. (Optional) Populate the database with test data
```bash
python manage.py populate_db --users 100 --events 1000 --registrations 2000 --interested 2000
```

7. Start the server using Daphne (for WebSockets support)
```bash
daphne -p 8000 config.asgi:application
```

7. The API will be available at ```http://localhost:8000```

### Security Monitoring Setup
The security monitoring system starts automatically when the Django application runs. The monitoring background thread:

- Analyzes user activity logs every 2 minutes
- Detects suspicious behavior based on configurable thresholds
- Flags users who perform too many operations in a short time window

To access the monitoring features:

1. Register a user and assign them the 'ADMIN' role (or use an existing admin account)
2. Log in with the admin account
3. Navigate to the Admin Dashboard at ```/admin```
4. View monitored users and activity logs

Simulating Attacks

For testing the security monitoring system:

1. Log in with an admin account
2. Go to the Admin Dashboard
3. Use the "Simulate Attack" button to generate high-frequency operations from a test user
4. Wait for the next monitoring cycle (up to 2 minutes)
5. Refresh the dashboard to see the simulated attacker added to the monitored users list

### Building for Production

#### Frontend
```bash
npm run build
```

#### Backend
For production deployment, consider using:
```bash
daphne -b 0.0.0.0 -p 8000 event_manager.asgi:application
```

### API Endpoints
Events
- ```GET /api/events/``` - Get all events (with optional filtering and sorting)
- ```POST /api/events/``` - Create a new event
- ```GET /api/events/{event_id}/``` - Get a specific event
- ```PATCH /api/events/{event_id}/``` - Update a specific event
- ```DELETE /api/events/{event_id}/``` - Delete a specific event

Users
- ```GET /api/users/{user_id}/``` - Get user details
- ```PATCH /api/users/{user_id}/``` - Update user details
- ```GET /api/users/{user_id}/events/``` - Get events created by a user
- ```GET /api/users/{user_id}/interested/``` - Get events a user is interested in
- ```POST /api/users/{user_id}/interested/``` - Add an event to user's interested list
- ```DELETE /api/users/{user_id}/interested/{event_id}/``` - Remove an event from user's interested list

Authentication
- ```POST /api/auth/``` - Authenticate a user
- ```POST /api/register/``` - Register a new user

Monitoring (Admin Only)
- ```GET /api/monitored-users/``` - Get list of monitored users
- ```GET /api/activity-logs/``` - Get user activity logs
- ```POST /api/simulate-attack/``` - Simulate a high-frequency attack

Statistics
- ```GET /api/statistics/events/``` - Get event statistics
- ```GET /api/statistics/categories/``` - Get event category distribution
- ```GET /api/statistics/user-engagement/``` - Get user engagement metrics

Files
- ```POST /api/upload/``` - Upload a file
- ```POST /api/upload/chunked/``` - Upload a large file in chunks
- ```POST /api/download/{filename}``` - Download a file

### Filtering and Sorting
Events can be filtered and sorted using query parameters:

- ```?start_date=YYYY-MM-DD``` - Filter events starting from this date
- ```?end_date=YYYY-MM-DD``` - Filter events up to this date
- ```?category=CategoryName``` - Filter events by category
- ```?is_online=true|false``` - Filter events by online/offline status
- ```?search=query``` - Search events by title, description, location, or category
- ```?sort_by=field``` - Sort events by field (date, title, category)
- ```?sort_order=asc|desc``` - Sort order (ascending or descending)
