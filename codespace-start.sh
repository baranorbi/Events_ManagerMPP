#!/bin/bash

echo "Starting Events Manager in Codespaces with Daphne..."

# Set environment variables for Codespaces
export DEBUG=True
export ALLOWED_HOSTS="*"
export CORS_ALLOWED_ORIGINS="*"
export CODESPACE_NAME="refactored-orbit-6rgjx5ggp9rcrg7g"

# Try to start Redis (optional - will use in-memory channel layer if not available)
echo "🔴 Attempting to start Redis..."
if command -v redis-server &> /dev/null; then
    redis-server --daemonize yes --port 6379
    echo "Redis started"
else
    echo "Redis not available, using in-memory channel layer"
fi

# Wait for Redis to start (if it started)
sleep 3

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

# Create migrations if needed
echo "Checking for model changes..."
python manage.py makemigrations

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

# Start Daphne server for WebSocket support
echo "Starting Daphne server..."
daphne -b 0.0.0.0 -p 8000 event_manager.asgi:application &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 15

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
echo "Events Manager started with Daphne!"
echo "Your Codespace URLs:"
echo "   Frontend (dev): https://refactored-orbit-6rgjx5ggp9rcrg7g-5173.app.github.dev"
echo "   Backend API: https://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev"
echo "   Admin Panel: https://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev/admin"
echo "   WebSocket: wss://refactored-orbit-6rgjx5ggp9rcrg7g-8000.app.github.dev/ws/events/"
echo ""
echo "🔑 Admin credentials: admin / admin123"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "Cleaning up..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap cleanup on script exit
trap cleanup EXIT

# Keep script running
wait