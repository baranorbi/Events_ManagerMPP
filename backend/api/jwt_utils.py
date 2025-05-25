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
        refresh['user_id'] = user_id
    else:
        user_id = user.id
        refresh['user_id'] = user_id
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }