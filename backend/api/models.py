from django.db import models
from datetime import datetime

# These are just model definitions for validation
# The actual data will be stored in memory

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
        # This tells Django not to create a table for this model
        # We'll use the in-memory store instead
        managed = False

class User(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    avatar = models.URLField(null=True, blank=True)
    
    class Meta:
        # This tells Django not to create a table for this model
        # We'll use the in-memory store instead
        managed = False

