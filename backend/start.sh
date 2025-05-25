#!/bin/bash
echo "Waiting for database..."
for i in {1..30}; do
  python -c "import psycopg2; psycopg2.connect(\"$DATABASE_URL\")" && break
  echo "Waiting for database... $i/30"
  sleep 2
done
python manage.py migrate --noinput
echo "Starting application server..."
daphne -b 0.0.0.0 -p 8000 event_manager.asgi:application