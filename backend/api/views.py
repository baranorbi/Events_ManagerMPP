from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import EventSerializer, UserSerializer, AuthSerializer, EventFilterSerializer
from .memory_store import memory_store
from datetime import datetime
import os
import shutil
from django.conf import settings
from django.http import FileResponse, HttpResponse, HttpResponseNotFound
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.parsers import FileUploadParser, MultiPartParser
from wsgiref.util import FileWrapper
import uuid
import mimetypes


# Create media directory if it doesn't exist
if not os.path.exists(os.path.join(settings.BASE_DIR, 'media')):
    os.makedirs(os.path.join(settings.BASE_DIR, 'media'))

# Create upload directory if it doesn't exist
if not os.path.exists(os.path.join(settings.BASE_DIR, 'media', 'uploads')):
    os.makedirs(os.path.join(settings.BASE_DIR, 'media', 'uploads'))

class EventListView(APIView):
    def get(self, request):
        # Check if pagination is requested
        page = request.query_params.get('page', '1')
        page_size = request.query_params.get('page_size', '12')
        
        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            page = 1
            page_size = 12
        
        # Get filters if any
        filter_serializer = EventFilterSerializer(data=request.query_params)
        filters = None
        
        if filter_serializer.is_valid():
            filters = filter_serializer.validated_data
        
        # Get paginated results
        if 'pagination' in request.query_params and request.query_params['pagination'] == 'true':
            paginated_data = memory_store.get_paginated_events(page, page_size, filters)
            
            return Response({
                'events': EventSerializer(paginated_data['events'], many=True).data,
                'pagination': {
                    'total_events': paginated_data['total_events'],
                    'total_pages': paginated_data['total_pages'],
                    'current_page': paginated_data['current_page'],
                    'page_size': paginated_data['page_size'],
                    'has_next': paginated_data['has_next'],
                    'has_previous': paginated_data['has_previous']
                }
            })
        
        # Otherwise handle as before
        if filters:
            events = memory_store.filter_events(filters)
            
            # Sort if requested
            sort_by = filters.get('sort_by', '')
            sort_order = filters.get('sort_order', 'asc')
            if sort_by:
                events = memory_store.sort_events(events, sort_by, sort_order)
        else:
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

class ApiRootView(APIView):
    def get(self, request):
        return Response({"status": "ok", "message": "API is running"})
        
    def head(self, request):
        return Response(status=status.HTTP_200_OK)

# Add these API views for file uploads
class FileUploadView(APIView):
    parser_classes = (MultiPartParser, FileUploadParser)
    
    def post(self, request, format=None):
        # Get the uploaded file
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({'error': 'No file was provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a unique filename
        filename, ext = os.path.splitext(file_obj.name)
        unique_filename = f"{filename}_{uuid.uuid4().hex}{ext}"
        
        # Save the file
        file_path = os.path.join('uploads', unique_filename)
        
        # Use Django's default storage to save the file
        file_path = default_storage.save(file_path, ContentFile(file_obj.read()))
        
        # Get absolute URL
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_path)
        
        return Response({
            'file_name': os.path.basename(file_path),
            'file_url': file_url,
            'file_size': file_obj.size,
            'file_type': file_obj.content_type
        }, status=status.HTTP_201_CREATED)

class ChunkedFileUploadView(APIView):
    """Endpoint for handling chunked uploads of large files"""
    parser_classes = (MultiPartParser,)
    
    def post(self, request):
        chunk = request.FILES.get('chunk')
        filename = request.POST.get('filename')
        chunk_number = int(request.POST.get('chunk_number', 0))
        total_chunks = int(request.POST.get('total_chunks', 1))
        file_id = request.POST.get('file_id', str(uuid.uuid4()))
        
        if not chunk or not filename:
            return Response({"error": "Missing chunk or filename"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create temp directory for chunks if it doesn't exist
        chunks_dir = os.path.join(settings.BASE_DIR, 'media', 'chunks', file_id)
        if not os.path.exists(chunks_dir):
            os.makedirs(chunks_dir, exist_ok=True)
        
        # Save this chunk
        chunk_path = os.path.join(chunks_dir, f'chunk_{chunk_number}')
        with open(chunk_path, 'wb+') as destination:
            for chunk_data in chunk.chunks():
                destination.write(chunk_data)
        
        # Check if all chunks are uploaded
        if chunk_number == total_chunks - 1:
            # All chunks received, combine them
            final_path = os.path.join(settings.BASE_DIR, 'media', 'uploads', filename)
            
            # Ensure uploads directory exists
            os.makedirs(os.path.dirname(final_path), exist_ok=True)
            
            # Combine all chunks
            with open(final_path, 'wb+') as final_file:
                for i in range(total_chunks):
                    chunk_file_path = os.path.join(chunks_dir, f'chunk_{i}')
                    with open(chunk_file_path, 'rb') as chunk_file:
                        final_file.write(chunk_file.read())
            
            # Clean up chunks
            shutil.rmtree(chunks_dir)
            
            # Get file URL
            file_url = request.build_absolute_uri(settings.MEDIA_URL + 'uploads/' + filename)
            
            # Get file size
            file_size = os.path.getsize(final_path)
            
            # Get file type
            file_type, _ = mimetypes.guess_type(final_path)
            if not file_type:
                file_type = 'application/octet-stream'
            
            return Response({
                'status': 'complete',
                'file_name': filename,
                'file_url': file_url,
                'file_size': file_size,
                'file_type': file_type
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
        # Construct the file path
        file_path = os.path.join(settings.BASE_DIR, 'media', 'uploads', filename)
        
        if not os.path.exists(file_path):
            return HttpResponseNotFound('File not found')
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Open the file
        file_handle = open(file_path, 'rb')
        
        # Create a file response with streaming
        response = FileResponse(
            FileWrapper(file_handle),
            content_type=content_type
        )
        
        # Set content disposition header
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = file_size
        
        return response