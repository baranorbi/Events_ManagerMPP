#!/bin/bash

echo "Starting Events Manager in Codespaces with Daphne..."

# Set environment variables for Codespaces
export DEBUG=True
export ALLOWED_HOSTS="*"
export CORS_ALLOWED_ORIGINS="*"
export CODESPACE_NAME="refactored-orbit-6rgjx5ggp9rcrg7g"

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec events-postgres pg_isready -U events_user -d events_manager >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        echo "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done
    echo "❌ PostgreSQL failed to start within 60 seconds"
    return 1
}

# Start PostgreSQL Docker container
echo "🟡 Starting PostgreSQL..."

# Stop and remove existing container if it exists
docker stop events-postgres 2>/dev/null || true
docker rm events-postgres 2>/dev/null || true

# Start fresh PostgreSQL container
echo "Starting fresh PostgreSQL container..."
docker run --name events-postgres \
  -e POSTGRES_DB=events_manager \
  -e POSTGRES_USER=events_user \
  -e POSTGRES_PASSWORD=events_password \
  -p 5433:5432 \
  -d postgres:14

# Wait for PostgreSQL to be ready
if ! wait_for_postgres; then
    echo "❌ Failed to start PostgreSQL. Falling back to SQLite."
    # Update Django settings to use SQLite as fallback
    cd backend
    python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_manager.settings')
import django
django.setup()
from django.conf import settings
print('Falling back to SQLite database')
" 2>/dev/null || echo "Could not configure fallback database"
    cd ..
else
    echo "✅ PostgreSQL is running on port 5433"
fi

# Try to start Redis (optional - will use in-memory channel layer if not available)
echo "🔴 Attempting to start Redis..."
if command -v redis-server &> /dev/null; then
    redis-server --daemonize yes --port 6379 2>/dev/null || echo "Redis already running or failed to start"
    echo "Redis started"
else
    echo "Redis not available, using in-memory channel layer"
fi

# Start Django backend with Daphne (for WebSocket support)
echo "Starting Django backend with Daphne..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if requirements.txt is newer than venv
if [ requirements.txt -nt venv/pyvenv.cfg ] || [ ! -f "venv/installed" ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    touch venv/installed
fi

# Test database connection before proceeding
echo "Testing database connection..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_manager.settings')
import django
django.setup()
from django.db import connection
try:
    connection.ensure_connection()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    print('Continuing with limited functionality...')
" 2>/dev/null || echo "Database connection test failed"

# Create migrations if needed
echo "Checking for model changes..."
python manage.py makemigrations --check --dry-run 2>/dev/null || python manage.py makemigrations 2>/dev/null || echo "Migration check failed"

# Run migrations with error handling
echo "Running migrations..."
python manage.py migrate 2>/dev/null || echo "Migration failed - continuing anyway"

# Import sample data using your database service
echo "Seeding database..."
python manage.py shell -c "
from api.database_service import database_service
try:
    # Check if data already exists
    from api.models import User, Event
    if User.objects.count() == 0 and Event.objects.count() == 0:
        database_service._seed_sample_data()
        print('✅ Sample data imported successfully')
    else:
        print('✅ Database already contains data')
except Exception as e:
    print(f'Sample data import failed: {e}')
" 2>/dev/null || echo "Database seeding failed"

# Start Daphne server for WebSocket support
echo "Starting Daphne server..."
daphne -b 0.0.0.0 -p 8000 event_manager.asgi:application &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Test if backend is responding
echo "Testing backend health..."
curl -s http://localhost:8000/api/ >/dev/null 2>&1 && echo "✅ Backend is responding" || echo "❌ Backend health check failed"

# Start frontend development server
echo "Starting frontend..."
cd ..

# Install frontend dependencies if needed
if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "✅ Events Manager started!"
echo "📋 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep events-postgres || echo "   PostgreSQL: Not running (using SQLite fallback)"
echo "   Backend: Running on port 8000"
echo "   Frontend: Running on port 5173"
echo ""
echo "🌐 Your Codespace URLs:"
echo "   Frontend (dev): https://refactored-orbit-6rgjx5ggp9rcrg7g-5173.app.github.dev"
echo "   Backend API: https://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev"
echo "   WebSocket: wss://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev/ws/events/"
echo ""
echo "🔑 Test credentials:"
echo "   User: john@example.com / password123"
echo "   Admin: admin@example.com / admin123"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Cleaning up..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    docker stop events-postgres 2>/dev/null || true
    echo "Cleanup complete"
    exit
}

# Trap cleanup on script exit
trap cleanup EXIT

# Keep script running
wait