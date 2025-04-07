import os
import django

# Set Django settings module first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'event_manager.settings')

# Initialize Django before importing any models
django.setup()

# Now import the rest
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import api.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})