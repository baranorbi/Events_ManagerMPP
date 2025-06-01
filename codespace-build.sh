#!/bin/bash

echo "Building Events Manager for production in Codespaces..."

# Build frontend
echo "Building frontend..."
npm run build

# Generate SSL certificates for HTTPS
echo "Generating SSL certificates..."
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=*.app.github.dev" \
  -addext "subjectAltName=DNS:*.app.github.dev,DNS:localhost,IP:127.0.0.1"

echo "SSL certificates generated"

# Start production services with Docker
echo "Starting production services..."
docker-compose up --build -d

echo "Production build complete!"
echo "Your Codespace is now running in production mode"
echo "Check status: docker-compose ps"