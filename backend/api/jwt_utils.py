from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """
    Generate JWT tokens for a user
    Works with both dictionary-like objects and model instances
    """
    refresh = RefreshToken()
    
    # Handle both dict-like objects and model instances
    if isinstance(user, dict):
        # It's a dictionary
        user_id = user.get('id', '')
        email = user.get('email', '')
        name = user.get('name', '')
        role = user.get('role', 'REGULAR')
    else:
        # Assume it's a model instance
        user_id = getattr(user, 'id', '')
        email = getattr(user, 'email', '')
        name = getattr(user, 'name', '')
        role = getattr(user, 'role', 'REGULAR')
    
    # Add user info to token payload
    refresh['user_id'] = user_id
    refresh['email'] = email
    refresh['name'] = name
    refresh['role'] = role
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }