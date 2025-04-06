from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import EventSerializer, UserSerializer, AuthSerializer, EventFilterSerializer
from .memory_store import memory_store
from datetime import datetime

class EventListView(APIView):
    def get(self, request):
        # Get all events or filter based on query params
        filter_serializer = EventFilterSerializer(data=request.query_params)
        if filter_serializer.is_valid():
            filters = filter_serializer.validated_data
            events = memory_store.filter_events(filters)
            
            # Sort if requested
            sort_by = filters.get('sort_by', '')
            sort_order = filters.get('sort_order', 'asc')
            if sort_by:
                events = memory_store.sort_events(events, sort_by, sort_order)
            
            serializer = EventSerializer(events, many=True)
            return Response(serializer.data)
        else:
            # If filter params are invalid, return all events
            events = memory_store.get_all_events()
            serializer = EventSerializer(events, many=True)
            return Response(serializer.data)
    
    def post(self, request):
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            # Convert date string to datetime object if needed
            validated_data = serializer.validated_data
            if isinstance(validated_data.get('date'), str):
                validated_data['date'] = datetime.strptime(validated_data['date'], '%Y-%m-%d').date()
            
            event = memory_store.create_event(validated_data)
            return Response(event, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EventDetailView(APIView):
    def get(self, request, event_id):
        event = memory_store.get_event(event_id)
        if not event:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EventSerializer(event)
        return Response(serializer.data)
    
    def patch(self, request, event_id):
        event = memory_store.get_event(event_id)
        if not event:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EventSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            updated_event = memory_store.update_event(event_id, serializer.validated_data)
            return Response(updated_event)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, event_id):
        success = memory_store.delete_event(event_id)
        if not success:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserEventsView(APIView):
    def get(self, request, user_id):
        events = memory_store.get_user_events(user_id)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

class UserInterestedEventsView(APIView):
    def get(self, request, user_id):
        events = memory_store.get_interested_events(user_id)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
    
    def post(self, request, user_id):
        event_id = request.data.get('event_id')
        if not event_id:
            return Response({"error": "event_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        success = memory_store.add_to_interested(user_id, event_id)
        if not success:
            return Response({"error": "Event not found or already in interested list"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"success": True})
    
    def delete(self, request, user_id, event_id):
        success = memory_store.remove_from_interested(user_id, event_id)
        if not success:
            return Response({"error": "Event not found in interested list"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserDetailView(APIView):
    def get(self, request, user_id):
        user = memory_store.get_user(user_id)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request, user_id):
        user = memory_store.get_user(user_id)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = memory_store.update_user(user_id, serializer.validated_data)
            return Response(updated_user)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuthView(APIView):
    def post(self, request):
        serializer = AuthSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            user = memory_store.authenticate_user(email, password)
            if user:
                return Response(user)
            
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

