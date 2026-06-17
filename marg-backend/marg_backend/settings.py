import os
from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize django-environ
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['*']),
    CORS_ALLOWED_ORIGINS=(list, []),
)

# Read .env file from base directory
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Quick-start development settings - unsuitable for production
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party Apps
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'channels',
    'django_celery_beat',
    
    # Local Apps — Phase 1 & 2
    'common.apps.CommonConfig',
    'accounts.apps.AccountsConfig',
    'organizations.apps.OrganizationsConfig',
    'factories.apps.FactoriesConfig',
    'warehouses.apps.WarehousesConfig',
    'fleet.apps.FleetConfig',
    'shipments.apps.ShipmentsConfig',
    'operations.apps.OperationsConfig',
    'logistics.apps.LogisticsConfig',
    'notifications.apps.NotificationsConfig',
    'audit.apps.AuditConfig',
    'chat',
    'marketplace',
    
    # Local Apps — Phase 3
    'telemetry.apps.TelemetryConfig',
    'geofencing.apps.GeofencingConfig',
    'optimization.apps.OptimizationConfig',
    'realtime.apps.RealtimeConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Should be as high as possible
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'marg_backend.urls'

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

WSGI_APPLICATION = 'marg_backend.wsgi.application'
ASGI_APPLICATION = 'marg_backend.asgi.application'

# Database
# Parses DATABASE_URL from environment
DATABASES = {
    'default': env.db('DATABASE_URL', default=f"sqlite:///{os.path.join(BASE_DIR, 'db.sqlite3')}")
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

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files (user uploads like avatars)
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'common.exceptions.custom_exception_handler',
}

# Simple JWT Configurations
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUDIENCE': None,
    'ISSUER': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# API Documentation Configuration (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Marg API',
    'DESCRIPTION': (
        'Intelligent Logistics Orchestration Platform API.\n\n'
        'Supports three interfaces: Factory Portal, Driver App, and Warehouse Portal.\n\n'
        'All endpoints require JWT Bearer authentication unless noted otherwise.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Authentication', 'description': 'Login, logout, token refresh'},
        {'name': 'Users', 'description': 'User management (Super Admin)'},
        {'name': 'Organizations', 'description': 'Company management'},
        {'name': 'Factories', 'description': 'Factory management'},
        {'name': 'Warehouses', 'description': 'Warehouse management'},
        {'name': 'Docks', 'description': 'Dock bay management'},
        {'name': 'Trucks', 'description': 'Truck/vehicle management'},
        {'name': 'Drivers', 'description': 'Driver profile management'},
        {'name': 'Shipments', 'description': 'Shipment CRUD'},
        {'name': 'Shipment Operations', 'description': 'Lifecycle actions: assign, dispatch, arrive, complete, ETA'},
        {'name': 'Notifications', 'description': 'In-app notification management'},
        {'name': 'Audit', 'description': 'Immutable audit trail (Super Admin)'},
        {'name': 'Dashboards', 'description': 'Summary endpoints for portals'},
        {'name': 'Telemetry', 'description': 'GPS telemetry ingestion and tracking'},
        {'name': 'Geofencing', 'description': 'Warehouse/factory geofence management'},
        {'name': 'Dock Recommendations', 'description': 'Dock optimization intelligence'},
        {'name': 'Return Loads', 'description': 'Empty-mile reduction marketplace'},
        {'name': 'Transit Dashboard', 'description': 'Live operational visibility'},
        {'name': 'System', 'description': 'Health checks and utilities'},
    ],
}

# ─── Channels Configuration ──────────────────────────────────────────────────

CHANNEL_LAYERS = {
    'default': {
        # Use in-memory layer for development (no Redis required)
        # Switch to channels_redis.core.RedisChannelLayer for production
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

# To use Redis (production), set REDIS_URL in .env and uncomment:
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {
#             'hosts': [env('REDIS_URL', default='redis://localhost:6379/0')],
#         },
#     }
# }

# ─── Celery Configuration ────────────────────────────────────────────────────

CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'

# Celery always eager = True means tasks run synchronously (no broker needed)
# Set to False in production when Redis is available
CELERY_TASK_ALWAYS_EAGER = env.bool('CELERY_TASK_ALWAYS_EAGER', default=True)
CELERY_TASK_EAGER_PROPAGATES = True

# Celery Beat schedule (periodic tasks)
CELERY_BEAT_SCHEDULE = {
    'optimize-docks-every-5-min': {
        'task': 'optimization.optimize_docks',
        'schedule': 300.0,  # 5 minutes
    },
    'find-return-loads-every-10-min': {
        'task': 'optimization.find_return_loads',
        'schedule': 600.0,  # 10 minutes
    },
    'detect-delays-every-15-min': {
        'task': 'optimization.detect_delays',
        'schedule': 900.0,  # 15 minutes
    },
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': env('DJANGO_LOG_LEVEL', default='INFO'),
            'propagate': False,
        },
    },
}
