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

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Waiting for database..."\n\
sleep 10\n\
python manage.py migrate --noinput\n\
echo "Starting application server..."\n\
daphne -b 0.0.0.0 -p 8000 event_manager.asgi:application\n' > /app/start.sh && \
    chmod +x /app/start.sh

# Run startup script
CMD ["/app/start.sh"]