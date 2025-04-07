import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .memory_store import memory_store
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
        # Add this connection to the "events" group
        await self.channel_layer.group_add("events_updates", self.channel_name)
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to events updates'
        }))
        print(f"WebSocket connection established with {self.scope['client']}")
        
    async def disconnect(self, close_code):
        # Remove this connection from the "events" group
        await self.channel_layer.group_discard("events_updates", self.channel_name)
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        
        if action == 'start_generation':
            # Start the background event generation
            if not hasattr(memory_store, 'generation_running') or not memory_store.generation_running:
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
            # Stop the background event generation
            if hasattr(memory_store, 'generation_running') and memory_store.generation_running:
                memory_store.generation_running = False
                await self.send(text_data=json.dumps({
                    'type': 'generation_status',
                    'status': 'stopped'
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'generation_status',
                    'status': 'not_running'
                }))
                
    # Method to receive event updates from the group
    async def event_update(self, event):
        # Send the update to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'event': event['event'],
            'action': event['action']
        }))
        
    def start_event_generation_thread(self):
        # Start a thread to generate events periodically
        thread = threading.Thread(target=self.generate_events_background)
        thread.daemon = True
        thread.start()
        
    def generate_events_background(self):
        # Set flag to indicate generation is running
        memory_store.generation_running = True
        
        # Categories to choose from
        categories = ['Technology', 'Music', 'Design', 'Business', 'Food', 'Art', 'Personal', 'Work']
        
        # Predefined image URLs for each category
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
        
        # Loop until stopped
        while getattr(memory_store, 'generation_running', False):
            try:
                # Create a random event
                event_id = str(int(datetime.now().timestamp() * 1000))
                category = random.choice(categories)
                
                # Generate a random date between tomorrow and 6 months from now
                tomorrow = datetime.now() + timedelta(days=1)
                future = datetime.now() + timedelta(days=180)
                random_days = random.randint(0, (future - tomorrow).days)
                event_date = tomorrow + timedelta(days=random_days)
                    
                is_online = random.choice([True, False])
                
                # Create event data
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
                
                # Add the event to the memory store
                memory_store.create_event(event_data)
                
                # Get serialized event for WebSocket broadcast
                serializer = EventSerializer(event_data)
                
                # Use asyncio to send a message to the channel layer
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(self.send_event_update(serializer.data, 'created'))
                loop.close()
                
                # Sleep for a random time between 3-10 seconds before generating the next event
                time.sleep(random.randint(3, 10))
                
            except Exception as e:
                print(f"Error in event generation thread: {e}")
                time.sleep(5)  # Wait a bit before retrying
    
    async def send_event_update(self, event_data, action):
        # Send event update to the channel layer group
        await database_sync_to_async(lambda: None)()  # Force switch to async context
        channel_layer = self.channel_layer
        await channel_layer.group_send(
            "events_updates",
            {
                'type': 'event_update',
                'event': event_data,
                'action': action
            }
        )