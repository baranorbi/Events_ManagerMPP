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
    email = models.EmailField(null=True, blank=True)  # Add email field
    password = models.CharField(max_length=100, null=True, blank=True)  # Add password field

    class Meta:
        pass

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