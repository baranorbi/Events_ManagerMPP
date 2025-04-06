from django.urls import path
from .views import (
    EventListView, 
    EventDetailView, 
    UserEventsView, 
    UserInterestedEventsView,
    UserDetailView,
    AuthView
)

urlpatterns = [
    # Event endpoints
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<str:event_id>/', EventDetailView.as_view(), name='event-detail'),
    
    # User endpoints
    path('users/<str:user_id>/', UserDetailView.as_view(), name='user-detail'),
    
    path('users/<str:user_id>/events/', UserEventsView.as_view(), name='user-events'),
    path('users/<str:user_id>/interested/', UserInterestedEventsView.as_view(), name='user-interested-events'),
    path('users/<str:user_id>/interested/<str:event_id>/', UserInterestedEventsView.as_view(), name='user-interested-event-detail'),
    
    # Auth endpoint
    path('auth/', AuthView.as_view(), name='auth'),
]

