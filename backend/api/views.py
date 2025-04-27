from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import EventSerializer, UserSerializer, AuthSerializer, EventFilterSerializer
from .database_service import database_service
from datetime import datetime
from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponseNotFound
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.parsers import FileUploadParser, MultiPartParser
from wsgiref.util import FileWrapper
import os
import uuid
import mimetypes
from django.db import models

if not os.path.exists(os.path.join(settings.BASE_DIR, 'media')):
    os.makedirs(os.path.join(settings.BASE_DIR, 'media'))

if not os.path.exists(os.path.join(settings.BASE_DIR, 'media', 'uploads')):
    os.makedirs(os.path.join(settings.BASE_DIR, 'media', 'uploads'))

class EventListView(APIView):
    def get(self, request):
        page = request.query_params.get('page', '1')
        page_size = request.query_params.get('page_size', '12')
        
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            page = 1
            page_size = 12
        
        filter_serializer = EventFilterSerializer(data=request.query_params)
        filters = None
        
        if filter_serializer.is_valid():
            filters = filter_serializer.validated_data
        
        if 'pagination' in request.query_params and request.query_params['pagination'] == 'true':
            paginated_data = database_service.get_paginated_events(page, page_size, filters)
            
            # Handle different response formats from database_service
            events = []
            total_events = 0
            has_next = False
            
            # If it's a dict with correct structure
            if isinstance(paginated_data, dict) and 'events' in paginated_data:
                events = paginated_data.get('events', [])
                total_events = paginated_data.get('total_events', len(events))
                has_next = paginated_data.get('has_next', page * page_size < total_events)
                current_page = paginated_data.get('current_page', page)
                
            # If it's a dict with different structure (results key instead of events)
            elif isinstance(paginated_data, dict) and 'results' in paginated_data:
                events = paginated_data.get('results', [])
                total_events = paginated_data.get('total', len(events))
                has_next = paginated_data.get('has_next', page * page_size < total_events)
                current_page = paginated_data.get('page', page)
            
            # If it's just a list of events
            elif isinstance(paginated_data, list):
                events = paginated_data
                total_events = len(events)
                # Calculate pagination values manually
                total_pages = (total_events + page_size - 1) // page_size if total_events > 0 else 1
                start_idx = (page - 1) * page_size
                end_idx = min(start_idx + page_size, total_events)
                events = events[start_idx:end_idx]
                has_next = end_idx < total_events
                current_page = page
            
            # Calculate total pages
            total_pages = (total_events + page_size - 1) // page_size if total_events > 0 else 1
            
            # Serialize the events
            serializer = EventSerializer(events, many=True)
            
            # Return with consistent structure matching the original memory_store version
            return Response({
                'events': serializer.data,
                'pagination': {
                    'total_events': total_events,
                    'total_pages': total_pages,
                    'current_page': current_page,
                    'page_size': page_size,
                    'has_next': has_next,
                    'has_previous': page > 1
                }
            })
        
        # Non-paginated response
        if filters:
            events = database_service.filter_events(filters)
            
            sort_by = filters.get('sort_by', '')
            sort_order = filters.get('sort_order', 'asc')
            if sort_by:
                # Check if sort_events exists in database_service
                if hasattr(database_service, 'sort_events'):
                    events = database_service.sort_events(events, sort_by, sort_order)
        else:
            events = database_service.get_all_events()
            
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            event = database_service.create_event(serializer.validated_data)
            return Response(event, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EventDetailView(APIView):
    def get(self, request, event_id):
        event = database_service.get_event(event_id)
        if not event:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EventSerializer(event)
        return Response(serializer.data)
    
    def patch(self, request, event_id):
        event = database_service.get_event(event_id)
        if not event:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = EventSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            updated_event = database_service.update_event(event_id, serializer.validated_data)
            return Response(updated_event)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, event_id):
        success = database_service.delete_event(event_id)
        if not success:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserEventsView(APIView):
    def get(self, request, user_id):
        events = database_service.get_user_events(user_id)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

class UserInterestedEventsView(APIView):
    def get(self, request, user_id):
        events = database_service.get_interested_events(user_id)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
    
    def post(self, request, user_id):
        event_id = request.data.get('event_id')
        if not event_id:
            return Response({'error': 'Event ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        success = database_service.add_to_interested(user_id, event_id)
        if not success:
            return Response({'error': 'Failed to add event to interested list'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"success": True})
    
    def delete(self, request, user_id, event_id):
        success = database_service.remove_from_interested(user_id, event_id)
        if not success:
            return Response({'error': 'Failed to remove event from interested list'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserDetailView(APIView):
    def get(self, request, user_id):
        user = database_service.get_user(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request, user_id):
        user = database_service.get_user(user_id)
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = database_service.update_user(user_id, serializer.validated_data)
            return Response(updated_user)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuthView(APIView):
    def post(self, request):
        serializer = AuthSerializer(data=request.data)
        if serializer.is_valid():
            user = database_service.authenticate_user(
                serializer.validated_data['email'],
                serializer.validated_data['password']
            )
            if user:
                return Response(user)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ApiRootView(APIView):
    def get(self, request):
        return Response({"status": "ok", "message": "API is running"})
        
    def head(self, request):
        return Response(status=status.HTTP_200_OK)

# File upload views remain mostly unchanged as they don't interact with the data store
class FileUploadView(APIView):
    parser_classes = (MultiPartParser, FileUploadParser)
    
    def post(self, request, format=None):
        # Get the uploaded file
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({'error': 'No file received'}, status=status.HTTP_400_BAD_REQUEST)
        
        filename, ext = os.path.splitext(file_obj.name)
        unique_filename = f"{filename}_{uuid.uuid4().hex}{ext}"
        
        file_path = os.path.join('uploads', unique_filename)
        
        file_path = default_storage.save(file_path, ContentFile(file_obj.read()))
        
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_path)
        
        return Response({
            'file_name': os.path.basename(file_path),
            'file_url': file_url,
            'file_size': file_obj.size,
            'file_type': file_obj.content_type
        }, status=status.HTTP_201_CREATED)

class ChunkedFileUploadView(APIView):
    parser_classes = (MultiPartParser,)
    
    def post(self, request):
        chunk = request.FILES.get('chunk')
        filename = request.POST.get('filename')
        chunk_number = int(request.POST.get('chunk_number', 0))
        total_chunks = int(request.POST.get('total_chunks', 1))
        file_id = request.POST.get('file_id', str(uuid.uuid4()))
        
        if not chunk or not filename:
            return Response({'error': 'Chunk or filename missing'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create temp directory for chunks if it doesn't exist
        chunks_dir = os.path.join(settings.BASE_DIR, 'media', 'chunks', file_id)
        if not os.path.exists(chunks_dir):
            os.makedirs(chunks_dir)
        
        # Save this chunk
        chunk_path = os.path.join(chunks_dir, f'chunk_{chunk_number}')
        with open(chunk_path, 'wb+') as destination:
            for chunk_part in chunk.chunks():
                destination.write(chunk_part)
        
        # If all chunks are uploaded
        if chunk_number == total_chunks - 1:
            # Combine chunks into complete file
            output_path = os.path.join(settings.MEDIA_ROOT, 'uploads', filename)
            with open(output_path, 'wb') as output_file:
                for i in range(total_chunks):
                    chunk_path = os.path.join(chunks_dir, f'chunk_{i}')
                    with open(chunk_path, 'rb') as chunk_file:
                        output_file.write(chunk_file.read())
            
            # Clean up chunks
            import shutil
            shutil.rmtree(chunks_dir)
            
            file_url = request.build_absolute_uri(settings.MEDIA_URL + 'uploads/' + filename)
            
            return Response({
                'status': 'complete',
                'file_name': filename,
                'file_url': file_url
            })
        
        return Response({
            'status': 'in_progress',
            'chunk_number': chunk_number,
            'total_chunks': total_chunks,
            'file_id': file_id
        })

class FileDownloadView(APIView):
    """Endpoint for downloading files with streaming support for large files"""
    
    def get(self, request, filename):
        file_path = os.path.join(settings.BASE_DIR, 'media', 'uploads', filename)
        
        if not os.path.exists(file_path):
            return HttpResponseNotFound('File not found')
        
        file_size = os.path.getsize(file_path)
        
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        file_handle = open(file_path, 'rb')
        
        response = FileResponse(
            FileWrapper(file_handle),
            content_type=content_type
        )
        
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = file_size
        
        return response