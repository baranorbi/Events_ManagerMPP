from django.urls import path
from .consumers import EventsConsumer, TokenAuthMiddleware

websocket_urlpatterns = [
    path('ws/events/', TokenAuthMiddleware(EventsConsumer.as_asgi())),
]