from .models import UserActivityLog, User
from django.utils import timezone
import json

def get_client_ip(request):
    """Get the client IP address from the request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_user_activity(user_id, action_type, entity_type, entity_id, details=None, request=None):
    """
    Log user activity for monitoring purposes
    
    Parameters:
    - user_id: The ID of the user performing the action
    - action_type: The type of action (CREATE, READ, UPDATE, DELETE)
    - entity_type: The type of entity being affected (Event, User, etc.)
    - entity_id: The ID of the entity being affected
    - details: Optional JSON-serializable dictionary with additional details
    - request: Optional HTTP request object to extract IP address
    """
    try:
        # If the user doesn't exist, don't log
        user = User.objects.filter(id=user_id).first()
        if not user:
            return
            
        # Get IP address if request is provided
        ip_address = None
        if request:
            ip_address = get_client_ip(request)
            
        # Create log entry
        UserActivityLog.objects.create(
            user=user,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            timestamp=timezone.now()
        )
    except Exception as e:
        # Don't let logging errors affect the main application flow
        print(f"Error logging user activity: {e}")