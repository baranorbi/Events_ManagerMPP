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
            # stop the background event generation
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
                
    async def event_update(self, event):
        # send update to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'event': event['event'],
            'action': event['action']
        }))
        
    def start_event_generation_thread(self):
        # thread to generate events periodically
        thread = threading.Thread(target=self.generate_events_background)
        thread.daemon = True
        thread.start()
        
    def generate_events_background(self):
        # indicate generation is running
        memory_store.generation_running = True
        
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
        
        while getattr(memory_store, 'generation_running', False):
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
                
                memory_store.create_event(event_data)
                
                serializer = EventSerializer(event_data)
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(self.send_event_update(serializer.data, 'created'))
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