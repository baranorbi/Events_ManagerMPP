FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create media directory if needed
RUN mkdir -p media

# Expose port for Daphne
EXPOSE 8000

# Make startup script executable
RUN chmod +x /app/start.sh

# Run startup script
CMD ["/app/start.sh"]