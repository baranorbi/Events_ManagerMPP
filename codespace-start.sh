#!/bin/bash

echo "Starting Events Manager in Codespaces with Daphne..."

# Set environment variables for Codespaces
export DEBUG=True
export ALLOWED_HOSTS="*"
export CORS_ALLOWED_ORIGINS="*"
export CODESPACE_NAME="refactored-orbit-6rgjx5ggp9rcrg7g"

# Start Redis in the background
echo "Starting Redis..."
sudo service redis-server start

# Wait for Redis to start
sleep 3

# Start Django backend with Daphne (for WebSocket support)
echo "Starting Django backend with Daphne..."
cd backend

# Activate virtual environment
source venv/bin/activate

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
echo "Admin credentials: admin / admin123"
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