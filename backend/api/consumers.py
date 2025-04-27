import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .database_service import database_service
from .serializers import EventSerializer
import asyncio
import random
import time
import threading
from datetime import datetime, timedelta

class EventsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"WebSocket connection attempt from {self.scope['client']}")
        await self.accept()
        await self.channel_layer.group_add("events_updates", self.channel_name)
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to events updates'
        }))
        print(f"WebSocket connection established with {self.scope['client']}")
        
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("events_updates", self.channel_name)
    
    # message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'start_generation':
            # start the background event generation
            if not hasattr(database_service, 'generation_running') or not database_service.generation_running:
                self.start_event_generation_thread()
                await self.send(text_data=json.dumps({
                    'type': 'generation_status',
                    'status': 'started'
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'generation_status',
                    'status': 'already_running'
                }))
        
        elif action == 'stop_generation':
            # stop the background event generation
            if hasattr(database_service, 'generation_running') and database_service.generation_running:
                database_service.generation_running = False
                await self.send(text_data=json.dumps({
                    'type': 'generation_status',
                    'status': 'stopped'
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'generation_status',
                    'status': 'not_running'
                }))
                
    async def event_update(self, event):
        # Convert event to client format before sending
        client_formatted_event = self.to_client_format(event['event'])
        
        # send update to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'event': client_formatted_event,
            'action': event['action']
        }))
    
    def to_client_format(self, event_data):
        """
        Transform server format (snake_case) to client format (camelCase)
        for consistent event data across WebSockets
        """
        # Extract fields that need to be renamed
        is_online = event_data.pop('is_online', None)
        start_time = event_data.pop('start_time', None)
        end_time = event_data.pop('end_time', None)
        created_by = event_data.pop('created_by', None)
        
        # Create a new dictionary with the remaining fields
        client_data = {**event_data}
        
        # Add transformed fields
        if is_online is not None:
            client_data['isOnline'] = is_online
        if start_time is not None:
            client_data['startTime'] = start_time
        if end_time is not None:
            client_data['endTime'] = end_time
        if created_by is not None:
            client_data['createdBy'] = created_by
            
        return client_data
        
    def start_event_generation_thread(self):
        # thread to generate events periodically
        thread = threading.Thread(target=self.generate_events_background)
        thread.daemon = True
        thread.start()
        
    def generate_events_background(self):
        # indicate generation is running
        database_service.generation_running = True
        
        categories = ['Technology', 'Music', 'Design', 'Business', 'Food', 'Art', 'Personal', 'Work']
        
        category_images = {
            'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475',
            'Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
            'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
            'Business': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
            'Food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
            'Art': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
            'Personal': 'https://images.unsplash.com/photo-1506863530036-1efeddceb993',
            'Work': 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc'
        }
        
        while getattr(database_service, 'generation_running', False):
            try:
                event_id = str(int(datetime.now().timestamp() * 1000))
                category = random.choice(categories)
                
                tomorrow = datetime.now() + timedelta(days=1)
                future = datetime.now() + timedelta(days=180)
                random_days = random.randint(0, (future - tomorrow).days)
                event_date = tomorrow + timedelta(days=random_days)
                    
                is_online = random.choice([True, False])
                
                event_data = {
                    'id': event_id,
                    'title': f"{category} Event {event_id[-4:]}",
                    'description': f"Automatically generated {category} event for real-time testing.",
                    'date': event_date.strftime('%Y-%m-%d'),
                    'location': 'Remote' if is_online else random.choice(['New York', 'San Francisco', 'Chicago', 'Boston', 'Austin']),
                    'category': category,
                    'is_online': is_online,
                    'image': category_images[category]
                }
                
                # Use database_service to create event instead of memory_store
                database_service.create_event(event_data)
                
                # Create both API format and client format
                serializer = EventSerializer(event_data)
                serialized_data = serializer.data
                
                # Transform to client format for WebSocket
                client_formatted_data = {
                    **serialized_data,
                    'isOnline': serialized_data.get('is_online'),
                    'startTime': serialized_data.get('start_time'),
                    'endTime': serialized_data.get('end_time'),
                    'createdBy': serialized_data.get('created_by'),
                }
                
                # Remove the snake_case fields to avoid duplication
                if 'is_online' in client_formatted_data:
                    del client_formatted_data['is_online']
                if 'start_time' in client_formatted_data:
                    del client_formatted_data['start_time']
                if 'end_time' in client_formatted_data:
                    del client_formatted_data['end_time']
                if 'created_by' in client_formatted_data:
                    del client_formatted_data['created_by']
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                # Send the client-formatted event
                loop.run_until_complete(self.send_event_update(client_formatted_data, 'created'))
                loop.close()
                
                time.sleep(random.randint(3, 10))
                
            except Exception as e:
                print(f"Error in event generation thread: {e}")
                time.sleep(5)
    
    async def send_event_update(self, event_data, action):
        await database_sync_to_async(lambda: None)()
        channel_layer = self.channel_layer
        await channel_layer.group_send(
            "events_updates",
            {
                'type': 'event_update',
                'event': event_data,
                'action': action
            }
        )