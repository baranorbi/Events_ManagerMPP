from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """
    Generate JWT tokens for a user
    Works with both dictionary-like objects and model instances
    """
    refresh = RefreshToken()
    
    # Handle both dict-like objects and model instances
    if isinstance(user, dict):
        user_id = user.get('id')
    else:
        # Handle model instances
        user_id = getattr(user, 'id', None)
    
    # Ensure user_id is an integer
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        # If conversion fails, log it and return None
        print(f"Warning: Invalid user ID format: {user_id}")
        return None
    
    # Store user_id in the token
    refresh['user_id'] = user_id
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }