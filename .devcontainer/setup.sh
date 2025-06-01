#!/bin/bash

echo "Setting up Events Manager in Codespaces..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Set up Python virtual environment for backend
echo "Setting up Python backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run Django migrations
echo "Running Django migrations..."
python manage.py migrate

# Create superuser (optional - for admin access)
echo "Creating Django superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

# Go back to root directory
cd ..

echo "Setup complete! Your Events Manager is ready in Codespaces."
echo "Your Codespace will be available at a public URL when you start the services."