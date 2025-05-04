from django.apps import AppConfig
import threading
import os
import time

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        # Prevent running twice in development (due to autoreload)
        if os.environ.get('RUN_MAIN') != 'true':
            from .monitoring import start_monitoring_thread
            
            # Start monitoring in a separate thread to avoid blocking app startup
            thread = threading.Thread(target=lambda: time.sleep(10) or start_monitoring_thread(), daemon=True)
            thread.start()

