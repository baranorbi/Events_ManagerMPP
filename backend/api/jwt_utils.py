from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    refresh = RefreshToken()
    
    # Add user info to token payload
    refresh['user_id'] = user['id']
    refresh['email'] = user.get('email', '')
    refresh['name'] = user.get('name', '')
    refresh['role'] = user.get('role', 'REGULAR')
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }