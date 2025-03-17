# Events Manager

A Vue 3 application for creating and managing events built with TypeScript, Vite, and Tailwind CSS.


## Features

- Browse and search events
- Filter events by category, date range, and location type
- Create, edit and delete events
- Manage your interested events list
- User authentication
- Responsive design

## Navigation

The application has several main pages:

- **Home** (`/`) - Browse all events with filtering capabilities
- **Trending** (`/trending`) - View popular events in a slideshow format
- **Profile** (`/profile`) - View your profile and interested events (requires login)
- **Manage Events** (`/manage-events`) - Create, edit and delete your events (requires login)
- **Sign In** (`/sign-in`) - Authentication page

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Testing

The application includes unit tests for the store functionality using Vitest.

### Running Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Test

Tests are for the filters on the home page.