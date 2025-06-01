#!/bin/bash

echo "Starting Events Manager in Codespaces..."

# Set environment variables for Codespaces
export DEBUG=True
export ALLOWED_HOSTS="*"
export CORS_ALLOWED_ORIGINS="*"

# Start Redis in the background
echo "Starting Redis..."
sudo service redis-server start

# Start Django backend
echo "Starting Django backend..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Start frontend development server
echo "Starting frontend..."
cd ..
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo "Events Manager started!"
echo "   Your Codespace URLs:"
echo "   Frontend (dev): Port 5173"
echo "   Backend API: Port 8000"
echo "   Production: Port 80/443 (after build)"

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