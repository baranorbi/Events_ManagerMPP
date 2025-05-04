from django.urls import path
from .views import (
    EventListView, 
    EventDetailView, 
    UserEventsView, 
    UserInterestedEventsView,
    UserDetailView,
    AuthView,
    ApiRootView,
    FileUploadView,
    ChunkedFileUploadView,
    FileDownloadView,
    EventStatisticsView,
    CategoryDistributionView,
    UserEngagementView
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
    
    # API root endpoint
    path('', ApiRootView.as_view(), name='api-root'),
    
    path('statistics/', EventStatisticsView.as_view(), name='event-statistics'),
    path('statistics/categories/', CategoryDistributionView.as_view(), name='category-distribution'),
    path('statistics/engagement/', UserEngagementView.as_view(), name='user-engagement'),
    
    # File upload endpoints
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('upload/chunked/', ChunkedFileUploadView.as_view(), name='chunked-upload'),
    path('download/<str:filename>/', FileDownloadView.as_view(), name='file-download'),
]

