from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, LogoutView, MeView,
    UserViewSet, WarehouseRegistrationView,
    SendOTPView, VerifyOTPView, RegisterView,
    LogisticsRegistrationView, ProvisionUserView, ChangePasswordView,
    FactoryRegistrationView,
)

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

# Auth endpoints (wired under 'auth/' prefix in main urls.py)
auth_urlpatterns = [
    path('send-otp/', SendOTPView.as_view(), name='auth-send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('register-warehouse/', WarehouseRegistrationView.as_view(), name='auth-register-warehouse'),
    path('register-factory/', FactoryRegistrationView.as_view(), name='auth-register-factory'),
    path('register/logistics/', LogisticsRegistrationView.as_view(), name='auth-register-logistics'),
    path('provision/', ProvisionUserView.as_view(), name='auth-provision'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]

# User CRUD endpoints (wired under 'users/' prefix in main urls.py)
user_urlpatterns = router.urls
