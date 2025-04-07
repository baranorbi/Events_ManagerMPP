from datetime import datetime, date
import json
from typing import Dict, List, Optional, Any, Union

class MemoryStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryStore, cls).__new__(cls)
            cls._instance.events = {}
            cls._instance.users = {}
            cls._instance.user_events = {}  # Maps user_id to list of event_ids
            cls._instance.interested_events = {}  # Maps user_id to list of event_ids
            cls._instance._initialize_data()
        return cls._instance
    
    def _initialize_data(self):
        # Initialize with sample data
        # Events
        self.events = {
            '1': {
                'id': '1',
                'title': 'Tech Conference 2025',
                'description': 'Annual tech conference with industry leaders discussing the latest trends in AI, blockchain, and cloud computing. Network with professionals and attend workshops.',
                'date': '2025-02-15',
                'location': 'San Francisco, CA',
                'category': 'Technology',
                'image': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            '2': {
                'id': '2',
                'title': 'Music Festival',
                'description': 'Three days of amazing live performances featuring top artists from around the world. Food vendors, art installations, and multiple stages for non-stop entertainment.',
                'date': '2025-03-01',
                'location': 'Austin, TX',
                'category': 'Music',
                'image': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            '3': {
                'id': '3',
                'title': 'Design Workshop',
                'description': 'Learn UI/UX design principles from experts in the field. Hands-on exercises, portfolio reviews, and networking opportunities with design professionals.',
                'date': '2025-02-20',
                'location': 'Online',
                'category': 'Design',
                'image': 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop',
                'is_online': True
            },
            '4': {
                'id': '4',
                'title': 'Startup Pitch Night',
                'description': 'Entrepreneurs pitch their ideas to investors and receive feedback. Great opportunity for networking and finding potential funding for your business.',
                'date': '2025-02-28',
                'location': 'New York, NY',
                'category': 'Business',
                'image': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop',
                'is_online': False
            },
            '5': {
                'id': '5',
                'title': 'Cooking Masterclass',
                'description': 'Learn to cook with a renowned chef specializing in international cuisine. Ingredients provided, and you\'ll take home recipes to recreate the dishes.',
                'date': '2025-03-10',
                'location': 'Chicago, IL',
                'category': 'Food',
                'image': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            '6': {
                'id': '6',
                'title': 'Photography Exhibition',
                'description': 'Showcasing works from emerging photographers exploring themes of urban life, nature, and human connection. Opening night includes meet and greet with artists.',
                'date': '2025-03-05',
                'location': 'Los Angeles, CA',
                'category': 'Art',
                'image': 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            '101': {
                'id': '101',
                'title': 'Birthday Party',
                'description': 'Celebrating with friends and family. Join us for food, drinks, and fun activities to mark this special occasion.',
                'date': '2025-03-15',
                'location': 'My House',
                'category': 'Personal',
                'image': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2070&auto=format&fit=crop',
                'created_by': 'user1',
                'is_online': False
            },
            '102': {
                'id': '102',
                'title': 'Team Building',
                'description': 'Company retreat for team bonding with outdoor activities, workshops, and strategy sessions to improve collaboration.',
                'date': '2025-04-10',
                'location': 'Mountain Resort',
                'category': 'Work',
                'image': 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?q=80&w=2070&auto=format&fit=crop',
                'created_by': 'user1',
                'is_online': False
            }
        }
        
        # Users
        self.users = {
            'user1': {
                'id': 'user1',
                'name': 'John Doe',
                'description': 'Event enthusiast and organizer',
                'avatar': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
                'email': 'john@example.com',
                'password': 'password123'
            }
        }
        
        # User events
        self.user_events = {
            'user1': ['101', '102']
        }
        
        # Interested events
        self.interested_events = {
            'user1': ['2', '4', '6']
        }
    
    def get_all_events(self) -> List[Dict]:
        return list(self.events.values())
    
    def get_event(self, event_id: str) -> Optional[Dict]:
        return self.events.get(event_id)
    
    def create_event(self, event_data: Dict) -> Dict:
        event_id = str(int(datetime.now().timestamp() * 1000))
        event_data['id'] = event_id
        
        if 'date' in event_data and isinstance(event_data['date'], datetime):
            event_data['date'] = event_data['date'].strftime('%Y-%m-%d')
        
        self.events[event_id] = event_data
        
        if 'created_by' in event_data:
            user_id = event_data['created_by']
            if user_id not in self.user_events:
                self.user_events[user_id] = []
            
            self.user_events[user_id].append(event_id)
        
        return event_data
    
    def update_event(self, event_id: str, event_data: Dict) -> Optional[Dict]:
        if event_id not in self.events:
            return None
        
        if 'date' in event_data and isinstance(event_data['date'], datetime):
            event_data['date'] = event_data['date'].strftime('%Y-%m-%d')
        
        for key, value in event_data.items():
            if key != 'id':
                self.events[event_id][key] = value
        
        return self.events[event_id]
    
    def delete_event(self, event_id: str) -> bool:
        if event_id not in self.events:
            return False
        
        event = self.events.pop(event_id)
        
        if 'created_by' in event:
            user_id = event['created_by']
            if user_id in self.user_events and event_id in self.user_events[user_id]:
                self.user_events[user_id].remove(event_id)
        
        for user_id, events in self.interested_events.items():
            if event_id in events:
                events.remove(event_id)
        
        return True
    

    def filter_events(self, filters: Dict) -> List[Dict]:
        filtered_events = self.get_all_events()
        
        if 'start_date' in filters and filters['start_date']:
            start_date = filters['start_date']
            filtered_events = [e for e in filtered_events if self._get_date_obj(e['date']) >= start_date]
        
        if 'end_date' in filters and filters['end_date']:
            end_date = filters['end_date']
            filtered_events = [e for e in filtered_events if self._get_date_obj(e['date']) <= end_date]
        
        if 'category' in filters and filters['category'] and filters['category'] != 'All categories':
            category = filters['category']
            filtered_events = [e for e in filtered_events if e['category'] == category]
        
        if 'is_online' in filters and filters['is_online'] is not None:
            is_online = filters['is_online']
            filtered_events = [e for e in filtered_events if e.get('is_online', False) == is_online]
        
        if 'search' in filters and filters['search']:
            search_query = filters['search'].lower()
            filtered_events = [
                event for event in filtered_events if
                search_query in event['title'].lower() or
                search_query in event['description'].lower() or
                search_query in event['location'].lower() or
                search_query in event['category'].lower()
            ]
        
        if 'sort_by' in filters and filters['sort_order']:
            filtered_events = self.sort_events(filtered_events, filters['sort_by'], filters['sort_order'])
        
        return filtered_events

    def _get_date_obj(self, date_val):
        if isinstance(date_val, str):
            return datetime.strptime(date_val, '%Y-%m-%d').date()
        elif isinstance(date_val, datetime):
            return date_val.date()
        elif isinstance(date_val, date):
            return date_val
        else:
            print(f"Warning: Unknown date format: {type(date_val)}, value: {date_val}")
            return datetime.now().date()
        
    def sort_events(self, events: List[Dict], sort_by: str, sort_order: str = 'asc') -> List[Dict]:
        if not sort_by:
            return events
        
        reverse = sort_order.lower() == 'desc'
        
        if sort_by == 'date':
            return sorted(events, key=lambda e: self._get_date_obj(e['date']), reverse=reverse)
        elif sort_by == 'title':
            return sorted(events, key=lambda e: e['title'].lower(), reverse=reverse)
        elif sort_by == 'category':
            return sorted(events, key=lambda e: e['category'].lower(), reverse=reverse)
        elif sort_by == 'location':
            return sorted(events, key=lambda e: e['location'].lower(), reverse=reverse)
        elif sort_by == 'is_online':
            return sorted(events, key=lambda e: e.get('is_online', False), reverse=reverse)
        
        return events
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        user = self.users.get(user_id)
        if user:
            user_copy = user.copy()
            if 'password' in user_copy:
                del user_copy['password']
            return user_copy
        return None
    
    def get_user_events(self, user_id: str) -> List[Dict]:
        if user_id not in self.user_events:
            return []
        
        event_ids = self.user_events[user_id]
        return [self.events[event_id] for event_id in event_ids if event_id in self.events]
    
    def get_interested_events(self, user_id: str) -> List[Dict]:
        if user_id not in self.interested_events:
            return []
        
        event_ids = self.interested_events[user_id]
        return [self.events[event_id] for event_id in event_ids if event_id in self.events]
    
    def add_to_interested(self, user_id: str, event_id: str) -> bool:
        if event_id not in self.events:
            return False
        
        if user_id not in self.interested_events:
            self.interested_events[user_id] = []
        
        if event_id not in self.interested_events[user_id]:
            self.interested_events[user_id].append(event_id)
            return True
        
        return False
    
    def remove_from_interested(self, user_id: str, event_id: str) -> bool:
        if user_id not in self.interested_events:
            return False
        
        if event_id in self.interested_events[user_id]:
            self.interested_events[user_id].remove(event_id)
            return True
        
        return False
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        for user_id, user in self.users.items():
            if user.get('email') == email and user.get('password') == password:
                user_copy = user.copy()
                if 'password' in user_copy:
                    del user_copy['password']
                return user_copy
        return None
    
    def update_user(self, user_id: str, user_data: Dict) -> Optional[Dict]:
        if user_id not in self.users:
            return None
        
        for key, value in user_data.items():
            if key != 'id' and key != 'password':
                self.users[user_id][key] = value
        
        user_copy = self.users[user_id].copy()
        if 'password' in user_copy:
            del user_copy['password']
        
        return user_copy
    
    def get_paginated_events(self, page=1, page_size=10, filters=None):
        if filters:
            events = self.filter_events(filters)
        else:
            events = list(self.events.values())
        
        # calc pagination
        total_events = len(events)
        total_pages = (total_events + page_size - 1) // page_size
        
        # within valid range
        page = max(1, min(page, total_pages if total_pages > 0 else 1))
        
        # slice for the requested page
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        return {
            'events': events[start_idx:end_idx],
            'total_events': total_events,
            'total_pages': total_pages,
            'current_page': page,
            'page_size': page_size,
            'has_next': page < total_pages,
            'has_previous': page > 1
        }

memory_store = MemoryStore()
