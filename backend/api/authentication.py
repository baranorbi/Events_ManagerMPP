from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth.models import AnonymousUser
from .database_service import database_service
import jwt
from django.conf import settings

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that works with your User model
    """
    
    def get_user(self, validated_token):
        """
        Get user from your database service instead of Django User model
        """
        try:
            user_id = validated_token.get('user_id')
            if user_id:
                user_data = database_service.get_user(user_id)
                if user_data:
                    # Create a simple user object for request.user
                    class CustomUser:
                        def __init__(self, user_data):
                            self.id = user_data['id']
                            self.email = user_data.get('email', '')
                            self.name = user_data.get('name', '')
                            self.role = user_data.get('role', 'REGULAR')
                            self.is_authenticated = True
                            self.is_anonymous = False
                        
                        def __str__(self):
                            return self.email or self.name or self.id
                    
                    return CustomUser(user_data)
            
            return AnonymousUser()
        except Exception:
            return AnonymousUser()