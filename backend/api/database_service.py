from .models import Event, User, UserEvent, InterestedEvent
from datetime import datetime
from typing import Dict, List, Optional, Any
from django.db import models
import uuid

class DatabaseService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_data()
        return cls._instance
    
    def _initialize_data(self):
        # Check if we need to seed initial data
        try:
            if Event.objects.count() == 0 and User.objects.count() == 0:
                self._seed_sample_data()
        except Exception as e:
            print(f"Database not ready yet: {e}")
            pass
    
    def _seed_sample_data(self):
        # admin user
        admin_user = User(
            id='admin1',
            name='Admin User',
            description='Site administrator',
            avatar='https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop',
            email='admin@example.com',
            password='admin123',
            role='ADMIN'
        )
        admin_user.save()
        
        # regular user
        user = User(
            id='user1',
            name='John Doe',
            description='Event enthusiast and organizer',
            avatar='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
            email='john@example.com',
            password='password123',
            role='REGULAR'
        )
        user.save()
        
        # Create sample events
        events = [
            {
                'id': '1',
                'title': 'Tech Conference 2025',
                'description': 'Annual tech conference with industry leaders discussing the latest trends in AI, blockchain, and cloud computing. Network with professionals and attend workshops.',
                'date': '2025-02-15',
                'location': 'San Francisco, CA',
                'category': 'Technology',
                'image': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            {
                'id': '2',
                'title': 'Music Festival',
                'description': 'Three days of amazing live performances featuring top artists from around the world. Food vendors, art installations, and multiple stages for non-stop entertainment.',
                'date': '2025-03-01',
                'location': 'Austin, TX',
                'category': 'Music',
                'image': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            {
                'id': '3',
                'title': 'Design Workshop',
                'description': 'Learn UI/UX design principles from experts in the field. Hands-on exercises, portfolio reviews, and networking opportunities with design professionals.',
                'date': '2025-02-20',
                'location': 'Online',
                'category': 'Design',
                'image': 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2070&auto=format&fit=crop',
                'is_online': True
            },
            {
                'id': '4',
                'title': 'Startup Pitch Night',
                'description': 'Entrepreneurs pitch their ideas to investors and receive feedback. Great opportunity for networking and finding potential funding for your business.',
                'date': '2025-02-28',
                'location': 'New York, NY',
                'category': 'Business',
                'image': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop',
                'is_online': False
            },
            {
                'id': '5',
                'title': 'Cooking Masterclass',
                'description': 'Learn to cook with a renowned chef specializing in international cuisine. Ingredients provided, and you\'ll take home recipes to recreate the dishes.',
                'date': '2025-03-10',
                'location': 'Chicago, IL',
                'category': 'Food',
                'image': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
            {
                'id': '6',
                'title': 'Photography Exhibition',
                'description': 'Showcasing works from emerging photographers exploring themes of urban life, nature, and human connection. Opening night includes meet and greet with artists.',
                'date': '2025-03-05',
                'location': 'Los Angeles, CA',
                'category': 'Art',
                'image': 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?q=80&w=2070&auto=format&fit=crop',
                'is_online': False
            },
        ]
        
        for event_data in events:
            event = Event(**event_data)
            event.save()
        
        # Create user-created events
        user_events = [
            {
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
            {
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
        ]
        
        for event_data in user_events:
            event = Event(**event_data)
            event.save()
            
            # Create UserEvent relationship
            UserEvent.objects.create(user_id='user1', event_id=event.id)
        
        # Add interested events for user
        interested_event_ids = ['2', '4', '6']
        for event_id in interested_event_ids:
            InterestedEvent.objects.create(user_id='user1', event_id=event_id)
    
    def get_all_events(self) -> List[Dict]:
        return list(Event.objects.values())
    
    def get_event(self, event_id: str) -> Optional[Dict]:
        try:
            return Event.objects.filter(id=event_id).values().first()
        except Event.DoesNotExist:
            return None
    
    def create_event(self, event_data: Dict) -> Dict:
        # Convert camelCase to snake_case if needed
        if 'startTime' in event_data:
            event_data['start_time'] = event_data.pop('startTime')
        if 'endTime' in event_data:
            event_data['end_time'] = event_data.pop('endTime')
        if 'isOnline' in event_data:
            event_data['is_online'] = event_data.pop('isOnline')
        if 'createdBy' in event_data:
            event_data['created_by'] = event_data.pop('createdBy')
        
        event_id = event_data.get('id') or str(int(datetime.now().timestamp() * 1000))
        event_data['id'] = event_id
        
        if 'date' in event_data and isinstance(event_data['date'], datetime):
            event_data['date'] = event_data['date'].strftime('%Y-%m-%d')
        
        event = Event(**event_data)
        event.save()
        
        if 'created_by' in event_data and event_data['created_by']:
            UserEvent.objects.create(user_id=event_data['created_by'], event_id=event_id)
        
        return event_data
    
    def update_event(self, event_id: str, event_data: Dict) -> Optional[Dict]:
        try:
            event = Event.objects.get(id=event_id)
            
            if 'date' in event_data and isinstance(event_data['date'], datetime):
                event_data['date'] = event_data['date'].strftime('%Y-%m-%d')
            
            for key, value in event_data.items():
                setattr(event, key, value)
            
            event.save()
            
            return {**event_data, 'id': event_id}
        except Event.DoesNotExist:
            return None
    
    def delete_event(self, event_id: str) -> bool:
        try:
            event = Event.objects.get(id=event_id)
            
            # Also remove any relationships
            UserEvent.objects.filter(event_id=event_id).delete()
            InterestedEvent.objects.filter(event_id=event_id).delete()
            
            event.delete()
            return True
        except Event.DoesNotExist:
            return False
    
    def filter_events(self, filters: Dict) -> List[Dict]:
        queryset = Event.objects.all()
        
        if 'start_date' in filters and filters['start_date']:
            queryset = queryset.filter(date__gte=filters['start_date'])
        
        if 'end_date' in filters and filters['end_date']:
            queryset = queryset.filter(date__lte=filters['end_date'])
        
        if 'category' in filters and filters['category'] and filters['category'] != 'All categories':
            queryset = queryset.filter(category=filters['category'])
        
        if 'is_online' in filters and filters['is_online'] is not None:
            queryset = queryset.filter(is_online=filters['is_online'])
        
        if 'search' in filters and filters['search']:
            query = filters['search'].lower()
            queryset = queryset.filter(
                models.Q(title__icontains=query) | 
                models.Q(description__icontains=query) | 
                models.Q(location__icontains=query) | 
                models.Q(category__icontains=query)
            )
        
        if 'sort_by' in filters and filters['sort_by']:
            sort_direction = '' if filters.get('sort_order', 'asc') == 'asc' else '-'
            queryset = queryset.order_by(f"{sort_direction}{filters['sort_by']}")
        
        return list(queryset.values())
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        try:
            user_data = User.objects.filter(id=user_id).values().first()
            if not user_data:
                return None
                
            # Add events array with event IDs created by this user
            user_data['events'] = list(UserEvent.objects.filter(
                user_id=user_id).values_list('event_id', flat=True))
                
            # Add interestedEvents array with event IDs this user is interested in
            user_data['interestedEvents'] = list(InterestedEvent.objects.filter(
                user_id=user_id).values_list('event_id', flat=True))
                
            return user_data
        except User.DoesNotExist:
            return None
    
    def get_user_events(self, user_id: str) -> List[Dict]:
        user_event_ids = UserEvent.objects.filter(user_id=user_id).values_list('event_id', flat=True)
        return list(Event.objects.filter(id__in=user_event_ids).values())
    
    def get_interested_events(self, user_id: str) -> List[Dict]:
        interested_event_ids = InterestedEvent.objects.filter(user_id=user_id).values_list('event_id', flat=True)
        return list(Event.objects.filter(id__in=interested_event_ids).values())
    
    def add_to_interested(self, user_id: str, event_id: str) -> bool:
        try:
            # Check if user and event exist
            User.objects.get(id=user_id)
            Event.objects.get(id=event_id)
            
            # Create the relationship if it doesn't exist
            InterestedEvent.objects.get_or_create(user_id=user_id, event_id=event_id)
            return True
        except (User.DoesNotExist, Event.DoesNotExist):
            return False
    
    def remove_from_interested(self, user_id: str, event_id: str) -> bool:
        try:
            InterestedEvent.objects.filter(user_id=user_id, event_id=event_id).delete()
            return True
        except:
            return False
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None
    
    def get_user_by_id(self, user_id):
        """Get a user by ID"""
        try:
            user = User.objects.get(id=user_id)
            return {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'description': user.description,
                'avatar': user.avatar,
                'role': user.role,
                'created_at': user.created_at
            }
        except User.DoesNotExist:
            return None
    
    def create_user(self, user_data: Dict) -> Optional[Dict]:
        try:
            # Create user object
            user = User(
                id=user_data.get('id', f"user_{uuid.uuid4().hex[:8]}"),
                name=user_data.get('name'),
                description=user_data.get('description', ''),
                avatar=user_data.get('avatar'),
                email=user_data.get('email'),
                password=user_data.get('password'),
                role=user_data.get('role', 'REGULAR')
            )
            user.save()
            
            # Return user as dict without password
            user_dict = {
                'id': user.id,
                'name': user.name,
                'description': user.description,
                'avatar': user.avatar,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at
            }
            return user_dict
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        try:
            user = User.objects.get(email=email, password=password)
            return user
        except User.DoesNotExist:
            return None
    
    def update_user(self, user_id: str, user_data: Dict) -> Optional[Dict]:
        try:
            user = User.objects.get(id=user_id)
            
            for key, value in user_data.items():
                setattr(user, key, value)
            
            user.save()
            return {**user_data, 'id': user_id}
        except User.DoesNotExist:
            return None
    
    def get_paginated_events(self, page=1, page_size=10, filters=None):
        events = self.filter_events(filters or {})
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        paginated_events = events[start_idx:end_idx]
        total_events = len(events)
        
        has_next = end_idx < total_events
        has_previous = page > 1
        
        return {
            'events': paginated_events,
            'has_next': has_next,  # Match the frontend's expected structure
            'has_previous': has_previous,
            'page': page,
            'page_size': page_size,
            'total': total_events,
            'total_pages': (total_events + page_size - 1) // page_size
        }


# Create singleton instance
database_service = DatabaseService()