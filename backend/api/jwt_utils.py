from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """
    Generate JWT tokens for a user (dict or model instance)
    """
    refresh = RefreshToken()
    
    # Handle both dict and model instance
    if isinstance(user, dict):
        user_id = user.get('id', '')
        email = user.get('email', '')
        role = user.get('role', 'REGULAR')
        name = user.get('name', '')
    else:
        # Model instance
        user_id = getattr(user, 'id', '')
        email = getattr(user, 'email', '')
        role = getattr(user, 'role', 'REGULAR')
        name = getattr(user, 'name', '')
    
    # Add custom claims to the token
    refresh['user_id'] = str(user_id)
    refresh['email'] = email
    refresh['role'] = role
    refresh['name'] = name
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }