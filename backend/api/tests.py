from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
import json
from datetime import datetime, timedelta

class EventAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a test event
        self.event_data = {
            'title': 'Test Event',
            'description': 'This is a test event',
            'date': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
            'location': 'Test Location',
            'category': 'Test Category',
            'is_online': False
        }
        
        response = self.client.post('/api/events/', self.event_data, format='json')
        self.test_event_id = response.data['id']
    
    def test_get_all_events(self):
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
    
    def test_create_event(self):
        new_event = {
            'title': 'New Test Event',
            'description': 'This is a new test event',
            'date': (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
            'location': 'New Test Location',
            'category': 'New Test Category',
            'is_online': True
        }
        
        response = self.client.post('/api/events/', new_event, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], new_event['title'])
    
    def test_get_event_detail(self):
        response = self.client.get(f'/api/events/{self.test_event_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.event_data['title'])
    
    def test_update_event(self):
        update_data = {
            'title': 'Updated Test Event',
            'description': 'This is an updated test event'
        }
        
        response = self.client.patch(f'/api/events/{self.test_event_id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], update_data['title'])
        self.assertEqual(response.data['description'], update_data['description'])
    
    def test_delete_event(self):
        response = self.client.delete(f'/api/events/{self.test_event_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify it's deleted
        response = self.client.get(f'/api/events/{self.test_event_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_filter_events(self):
        # Create events with different categories
        category1 = 'Category1'
        category2 = 'Category2'
        
        event1 = {
            'title': 'Event in Category 1',
            'description': 'This is an event in category 1',
            'date': (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
            'location': 'Location 1',
            'category': category1,
            'is_online': False
        }
        
        event2 = {
            'title': 'Event in Category 2',
            'description': 'This is an event in category 2',
            'date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            'location': 'Location 2',
            'category': category2,
            'is_online': True
        }
        
        self.client.post('/api/events/', event1, format='json')
        self.client.post('/api/events/', event2, format='json')
        
        # Filter by category
        response = self.client.get(f'/api/events/?category={category1}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # All returned events should be in category1
        for event in response.data:
            self.assertEqual(event['category'], category1)
        
        # Filter by is_online
        response = self.client.get('/api/events/?is_online=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # All returned events should be online
        for event in response.data:
            self.assertTrue(event['is_online'])
    
    def test_sort_events(self):
        # Create events with different dates
        event1 = {
            'title': 'A Event',
            'description': 'This is event A',
            'date': (datetime.now() + timedelta(days=20)).strftime('%Y-%m-%d'),
            'location': 'Location A',
            'category': 'Category A',
            'is_online': False
        }
        
        event2 = {
            'title': 'B Event',
            'description': 'This is event B',
            'date': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
            'location': 'Location B',
            'category': 'Category B',
            'is_online': True
        }
        
        self.client.post('/api/events/', event1, format='json')
        self.client.post('/api/events/', event2, format='json')
        
        # Sort by date ascending
        response = self.client.get('/api/events/?sort_by=date&sort_order=asc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify sorting
        dates = [event['date'] for event in response.data]
        self.assertEqual(dates, sorted(dates))
        
        # Sort by title descending
        response = self.client.get('/api/events/?sort_by=title&sort_order=desc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify sorting
        titles = [event['title'] for event in response.data]
        self.assertEqual(titles, sorted(titles, reverse=True))

class UserAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = 'user1'  # Using the pre-initialized user
    
    def test_get_user(self):
        response = self.client.get(f'/api/users/{self.user_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user_id)
    
    def test_update_user(self):
        update_data = {
            'name': 'Updated Name',
            'description': 'Updated description'
        }
        
        response = self.client.patch(f'/api/users/{self.user_id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], update_data['name'])
        self.assertEqual(response.data['description'], update_data['description'])
    
    def test_get_user_events(self):
        response = self.client.get(f'/api/users/{self.user_id}/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
    
    def test_get_interested_events(self):
        response = self.client.get(f'/api/users/{self.user_id}/interested/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
    
    def test_add_to_interested(self):
        # Create a test event
        event_data = {
            'title': 'Interesting Event',
            'description': 'This is an interesting event',
            'date': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
            'location': 'Interesting Location',
            'category': 'Interesting Category',
            'is_online': False
        }
        
        event_response = self.client.post('/api/events/', event_data, format='json')
        event_id = event_response.data['id']
        
        # Add to interested
        response = self.client.post(f'/api/users/{self.user_id}/interested/', {'event_id': event_id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify it was added
        response = self.client.get(f'/api/users/{self.user_id}/interested/')
        event_ids = [event['id'] for event in response.data]
        self.assertIn(event_id, event_ids)
    
    def test_remove_from_interested(self):
        # Get current interested events
        response = self.client.get(f'/api/users/{self.user_id}/interested/')
        if len(response.data) > 0:
            event_id = response.data[0]['id']
            
            # Remove from interested
            response = self.client.delete(f'/api/users/{self.user_id}/interested/{event_id}/')
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
            
            # Verify it was removed
            response = self.client.get(f'/api/users/{self.user_id}/interested/')
            event_ids = [event['id'] for event in response.data]
            self.assertNotIn(event_id, event_ids)

class AuthAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_auth_success(self):
        auth_data = {
            'email': 'john@example.com',
            'password': 'password123'
        }
        
        response = self.client.post('/api/auth/', auth_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], 'user1')
    
    def test_auth_failure(self):
        auth_data = {
            'email': 'wrong@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/auth/', auth_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

