from rest_framework import serializers
from .models import Event, User, UserActivityLog, MonitoredUser
from datetime import datetime
import uuid

class EventSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    date = serializers.DateField(error_messages={
        'invalid': 'Date format must be YYYY-MM-DD',
        'null': 'Event date is required'
    })
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    location = serializers.CharField(max_length=200)
    category = serializers.CharField(max_length=100)
    image = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    created_by = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    is_online = serializers.BooleanField(default=False)
    
    def validate_date(self, value):
        today = datetime.now().date()
        if value < today:
            raise serializers.ValidationError("Event date cannot be in the past")
        return value
    
    def validate(self, data):
        if 'start_time' in data and 'end_time' in data and data['start_time'] and data['end_time']:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({"end_time": "End time must be after start time"})
        return data

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField()
    avatar = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    email = serializers.EmailField(required=False)
    role = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    # Don't include password in regular serialization
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Remove password if it exists in the representation
        ret.pop('password', None)
        return ret

class UserRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    description = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    avatar = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    
    def validate_email(self, value):
        # Check if email already exists
        from .database_service import database_service
        if database_service.get_user_by_email(value):
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def create(self, validated_data):
        # Generate a unique ID for the user
        validated_data['id'] = f"user_{uuid.uuid4().hex[:8]}"
        validated_data['role'] = 'REGULAR'
        return validated_data

class AuthSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class EventFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    category = serializers.CharField(required=False, allow_blank=True)
    is_online = serializers.BooleanField(required=False, allow_null=True)
    search = serializers.CharField(required=False, allow_blank=True)
    sort_by = serializers.CharField(required=False, allow_blank=True)
    sort_order = serializers.CharField(required=False, default='asc')

class UserActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivityLog
        fields = ['id', 'user', 'user_name', 'action_type', 'entity_type', 'entity_id', 
                  'details', 'timestamp', 'ip_address']
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.name
        return None


class MonitoredUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    
    class Meta:
        model = MonitoredUser
        fields = ['id', 'user', 'user_id', 'name', 'email', 'reason', 'detection_time', 'is_active', 'details']
    
    def get_user_id(self, obj):
        return obj.user.id if obj.user else None
        
    def get_name(self, obj):
        return obj.user.name if obj.user else None
        
    def get_email(self, obj):
        return obj.user.email if obj.user else None


class TOTPVerifySerializer(serializers.Serializer):
    user_id = serializers.CharField(required=True)
    token = serializers.CharField(required=True)

class TOTPStatusSerializer(serializers.Serializer):
    is_enabled = serializers.BooleanField()