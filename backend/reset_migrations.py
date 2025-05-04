import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_manager.settings')
django.setup()

from django.db import connection

# Delete migration records for 'api' app
with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app = 'api';")
    print("Migration records for 'api' app have been deleted.")