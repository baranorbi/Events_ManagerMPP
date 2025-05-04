from django.db import models
from datetime import datetime

class Event(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    image = models.URLField(null=True, blank=True)
    created_by = models.CharField(max_length=100, null=True, blank=True)
    is_online = models.BooleanField(default=False)

    class Meta:
        pass

class User(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    avatar = models.URLField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    password = models.CharField(max_length=100, null=True, blank=True)
    role = models.CharField(max_length=20, choices=[
        ('REGULAR', 'Regular User'),
        ('ADMIN', 'Administrator')
    ], default='REGULAR')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email'], name='idx_user_email'),
            models.Index(fields=['role'], name='idx_user_role'),
        ]

class UserEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    event = models.ForeignKey(Event, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'event')

class InterestedEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interested_events')
    event = models.ForeignKey(Event, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'event')
        indexes = [
            models.Index(fields=['user_id'], name='idx_interested_user'),
            models.Index(fields=['event_id'], name='idx_interested_event'),
        ]

class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action_type = models.CharField(max_length=50)  # CREATE, READ, UPDATE, DELETE
    entity_type = models.CharField(max_length=50)  # Event, User, etc.
    entity_id = models.CharField(max_length=100)
    details = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user'], name='idx_activity_user'),
            models.Index(fields=['timestamp'], name='idx_activity_timestamp'),
            models.Index(fields=['action_type'], name='idx_activity_action_type'),
            models.Index(fields=['entity_type'], name='idx_activity_entity_type'),
        ]


class MonitoredUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='monitoring_records')
    reason = models.TextField()
    detection_time = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    details = models.JSONField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user'], name='idx_monitored_user'),
            models.Index(fields=['detection_time'], name='idx_monitored_detection_time'),
            models.Index(fields=['is_active'], name='idx_monitored_is_active'),
        ]