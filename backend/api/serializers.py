from rest_framework import serializers
from .models import Event, User
from datetime import datetime

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
        # Ensure date is not in the past
        today = datetime.now().date()
        if value < today:
            raise serializers.ValidationError("Event date cannot be in the past")
        return value
    
    def validate(self, data):
        # Validate start_time and end_time if both are provided
        if 'start_time' in data and 'end_time' in data and data['start_time'] and data['end_time']:
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({"end_time": "End time must be after start time"})
        return data

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField()
    avatar = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

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

