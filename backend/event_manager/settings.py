import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-h7f3$%^&*()_+asdfghjkl;qwertyuiop'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Updated ALLOWED_HOSTS for Codespaces
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'backend',
    '192.168.1.5',
    '188.27.132.153',
    'events-managermpp.pages.dev',
    '*.pages.dev',
    '*.app.github.dev',  # GitHub Codespaces
    '*.github.io',       # GitHub Pages
    '*',  # For Codespaces development - restrict in production
]

# HTTPS Configuration
USE_HTTPS = os.environ.get('USE_HTTPS', 'False') == 'True'

if USE_HTTPS:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_OPTIONS_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# Application definition
INSTALLED_APPS = [
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS settings - Updated for Codespaces
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins in development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "https://localhost",
    "http://localhost:5173",
    "https://192.168.1.5",
    "http://192.168.1.5",
    "https://188.27.132.153",
    "https://events-managermpp.pages.dev",
    "http://events-managermpp.pages.dev",
]

# Add Codespace origins dynamically
if os.environ.get('CODESPACE_NAME'):
    codespace_name = os.environ.get('CODESPACE_NAME')
    github_user = os.environ.get('GITHUB_USER', 'user')
    
    # Add common Codespace URLs
    codespace_origins = [
        f"https://{codespace_name}-80.app.github.dev",
        f"https://{codespace_name}-443.app.github.dev",
        f"https://{codespace_name}-5173.app.github.dev",
        f"https://{codespace_name}-8000.app.github.dev",
        f"http://{codespace_name}-80.app.github.dev",
        f"http://{codespace_name}-5173.app.github.dev",
        f"http://{codespace_name}-8000.app.github.dev",
    ]
    
    CORS_ALLOWED_ORIGINS.extend(codespace_origins)
    ALLOWED_HOSTS.extend([
        f"{codespace_name}-80.app.github.dev",
        f"{codespace_name}-443.app.github.dev",
        f"{codespace_name}-5173.app.github.dev",
        f"{codespace_name}-8000.app.github.dev",
    ])

# Add GitHub Pages domain if available
github_pages_domain = os.environ.get('GITHUB_PAGES_DOMAIN')
if github_pages_domain:
    CORS_ALLOWED_ORIGINS.extend([
        f"https://{github_pages_domain}",
        f"http://{github_pages_domain}",
    ])
    ALLOWED_HOSTS.append(github_pages_domain)

ROOT_URLCONF = 'event_manager.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'event_manager.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# JWT Configuration
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload configuration
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# Channels settings
ASGI_APPLICATION = 'event_manager.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)] if not DEBUG else [('localhost', 6379)],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'