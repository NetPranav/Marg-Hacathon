from django.db import transaction
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from organizations.models import Organization
from common.enums import OrganizationType, WarehouseType, UserRole
from warehouses.models import Warehouse, Rack, Shelf, DockBay

from common.permissions import IsSuperAdmin
from .otp_service import OTPService
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    AuthUserSerializer,
    CustomTokenObtainPairSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    RegisterSerializer,
    LogisticsRegistrationSerializer,
    ProvisionUserSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


# ─── Auth Views ──────────────────────────────────────────────────────────────

@extend_schema(tags=['Authentication'])
class SendOTPView(APIView):
    """Sends a 6-digit OTP to the provided phone number."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=SendOTPSerializer)
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']

        # Send OTP
        OTPService.generate_otp(phone)

        return Response(
            {"success": True, "message": "OTP sent successfully."},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Authentication'])
class VerifyOTPView(APIView):
    """Verifies OTP. Returns tokens if user exists, else prompts for registration."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=VerifyOTPSerializer)
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        otp = serializer.validated_data['otp_code']

        if not OTPService.verify_otp(phone, otp):
            return Response(
                {"success": False, "message": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists
        user = User.objects.filter(phone_number=phone).first()
        if not user:
            return Response(
                {"success": True, "is_new_user": True, "message": "OTP verified. Proceed to registration."},
                status=status.HTTP_200_OK
            )

        # Mark phone as verified
        if not user.is_phone_verified:
            user.is_phone_verified = True
            user.save(update_fields=['is_phone_verified'])

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "is_new_user": False,
                "data": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'organization': user.organization_id,
                        'organization_name': user.organization.name if user.organization else None,
                        'kyc_status': user.kyc_status,
                    }
                }
            },
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Authentication'])
class RegisterView(APIView):
    """Completes registration for a new user after OTP verification."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=RegisterSerializer)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        role = data['role']
        phone = data['phone_number']

        from kyc.models import InviteCode

        org = None

        # Handle role-specific org logic
        if role == UserRole.ADMIN:
            # Create a new organization for the Admin
            org_name = data.pop('company_name', f"{data['first_name']}'s Company")
            org_type = data.pop('org_type', 'LOGISTICS_PROVIDER')
            org = Organization.objects.create(name=org_name, org_type=org_type)

        elif role in [UserRole.EMPLOYEE, UserRole.DRIVER]:
            code_str = data.pop('invite_code', None)
            if code_str:
                try:
                    invite = InviteCode.objects.get(code=code_str, is_used=False)
                    org = invite.organization
                    role = invite.role
                except InviteCode.DoesNotExist:
                    return Response(
                        {"success": False, "message": "Invalid or expired invite code."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                org = Organization.objects.first()

        # Create user
        user = User.objects.create_user(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            phone_number=phone,
            role=role,
            organization=org,
            is_phone_verified=True
        )

        # Set password from request for dev testing
        password = data.get('password')
        if password:
            user.set_password(password)
        else:
            import secrets
            user.set_password(secrets.token_urlsafe(32))

        user.save()

        # Mark invite as used
        if 'invite' in locals() and invite:
            invite.is_used = True
            invite.used_by = user
            invite.save()

        # Generate tokens
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        custom_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'organization': user.organization_id,
                'organization_name': user.organization.name if user.organization else None,
                'kyc_status': user.kyc_status,
            }
        }

        return Response(
            {"success": True, "message": "Registration successful.", "data": custom_data},
            status=status.HTTP_201_CREATED
        )


@extend_schema(tags=['Authentication'])
class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint — returns JWT tokens plus user role & org info."""
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(tags=['Authentication'])
class LogoutView(APIView):
    """Blacklist the refresh token to log the user out."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {"success": False, "message": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"success": True, "message": "Logged out successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"success": False, "message": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(tags=['Authentication'])
class MeView(generics.RetrieveAPIView):
    """Returns the currently authenticated user's profile."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthUserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response({"success": True, "data": serializer.data})


@extend_schema(tags=['Authentication'])
class WarehouseRegistrationView(APIView):
    """
    Handles the 5-step warehouse onboarding in a single atomic transaction.
    Creates Organization, Warehouse, Manager User, and Initial Layout.
    """
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        # 1. Organization Info
        org_name = data.get('company_name') or data.get('warehouse_name', 'New Warehouse')
        email = data.get('email', '')
        phone = data.get('phone_number', '')
        password = data.get('password')

        if not email or not password:
            return Response({"success": False, "message": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"success": False, "message": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        org = Organization.objects.create(
            name=org_name,
            email=email,
            phone_number=phone,
            org_type=OrganizationType.WAREHOUSE,
        )

        # 2. User Creation
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=data.get('first_name', 'Warehouse'),
            last_name=data.get('last_name', 'Manager'),
            phone_number=phone,
            role=UserRole.WAREHOUSE_MANAGER,
            organization=org
        )

        # 3. Warehouse Details
        wh_type = data.get('warehouse_type', WarehouseType.DESTINATION_WAREHOUSE)
        capacity = data.get('capacity', 5000)
        max_trucks = data.get('max_concurrent_trucks', 5)
        operating_hours = data.get('operating_hours', '24/7')
        special_handling = data.get('special_handling', [])

        # Location
        country = data.get('country', '')
        state = data.get('state', '')
        city = data.get('city', '')
        postal_code = data.get('postal_code', '')
        full_address = data.get('full_address', '')
        lat = data.get('latitude', None)
        lng = data.get('longitude', None)

        warehouse = Warehouse.objects.create(
            organization=org,
            name=data.get('warehouse_name', f"{org_name} Facility"),
            warehouse_type=wh_type,
            capacity=capacity,
            max_concurrent_trucks=max_trucks,
            operating_hours=operating_hours,
            special_handling=special_handling,
            country=country,
            state=state,
            city=city,
            address=full_address,
            latitude=lat,
            longitude=lng,
            layout_width=50,
            layout_depth=30,
            layout_height=6,
        )

        # 4. Initial Layout Generation (Optional)
        num_racks = int(data.get('num_racks', 4))
        num_shelves = int(data.get('num_shelves', 4))
        num_docks = int(data.get('num_docks', 3))

        for i in range(num_docks):
            DockBay.objects.create(
                warehouse=warehouse,
                dock_number=f"D-{(i+1):02d}",
                x_position=10 + (i*10),
                z_position=2,
            )

        for i in range(num_racks):
            rack = Rack.objects.create(
                warehouse=warehouse,
                rack_id=f"R-{(i+1):02d}",
                row_index=i // 2,
                col_index=i % 2,
                num_shelves=num_shelves,
                x_position=10 + (i*8),
                z_position=15,
            )
            for j in range(num_shelves):
                Shelf.objects.create(
                    rack=rack,
                    level=j+1,
                    max_weight=500.0,
                    available_volume=float(rack.shelf_width * rack.shelf_depth * rack.shelf_height)
                )

        # Generate Tokens
        refresh = RefreshToken.for_user(user)

        # Build user data for response
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'organization': user.organization_id,
            'organization_name': org.name,
        }

        return Response({
            "success": True,
            "message": "Warehouse registered successfully.",
            "data": {
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Authentication'])
class FactoryRegistrationView(APIView):
    """
    Handles the simplified factory owner registration in a single atomic transaction.
    Creates Organization, Factory Owner (SUPER_ADMIN), and default Factory profile.
    """
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        # 1. User & Company Info
        full_name = data.get('full_name', '')
        first_name = full_name.split(' ')[0] if full_name else 'Factory'
        last_name = ' '.join(full_name.split(' ')[1:]) if ' ' in full_name else 'Owner'
        
        email = data.get('email', '')
        phone = data.get('phone_number', '')
        password = data.get('password')
        
        company_name = data.get('company_name', 'New Factory')
        industry_type = data.get('industry_type', 'OTHER')

        if not email or not password:
            return Response({"success": False, "message": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"success": False, "message": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Organization Info
        org = Organization.objects.create(
            name=company_name,
            email=email,
            phone_number=phone,
            org_type=OrganizationType.FACTORY,
            metadata={
                "industry_type": industry_type,
                "factory_size": data.get('factory_size', 'Medium'),
                "daily_volume": data.get('daily_volume', '50-200'),
            }
        )

        # 3. User Creation (Owner)
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            role=UserRole.SUPER_ADMIN,
            organization=org
        )

        # 4. Default Factory Profile
        from factories.models import Factory
        country = data.get('country', '')
        state = data.get('state', '')
        city = data.get('city', '')
        postal_code = data.get('pincode', '')
        full_address = data.get('address', '')

        Factory.objects.create(
            organization=org,
            name=f"{company_name} Main Facility",
            country=country,
            state=state,
            city=city,
            address=full_address,
            postal_code=postal_code,
            created_by=user,
        )

        # Generate Tokens
        refresh = RefreshToken.for_user(user)

        # Build user data for response
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'organization': user.organization_id,
            'organization_name': org.name,
        }

        return Response({
            "success": True,
            "message": "Factory registered successfully.",
            "data": {
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_201_CREATED)


# ─── User Management Views ──────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(tags=['Users'], summary='List users'),
    create=extend_schema(tags=['Users'], summary='Create a user'),
    retrieve=extend_schema(tags=['Users'], summary='Get user detail'),
    partial_update=extend_schema(tags=['Users'], summary='Update a user'),
    destroy=extend_schema(tags=['Users'], summary='Delete a user'),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    User management.

    - Super Admin: full CRUD on all users.
    - Org managers: read-only access to users in their own organization.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            from common.permissions import IsAdmin
            class IsSuperAdminOrAdmin(permissions.BasePermission):
                def has_permission(self, request, view):
                    return IsSuperAdmin().has_permission(request, view) or IsAdmin().has_permission(request, view)
            return [IsSuperAdminOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action == 'partial_update':
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return User.objects.select_related('organization').all()
        # Non-admins see only their own org's users
        return User.objects.select_related('organization').filter(
            organization=user.organization
        )

    def create(self, request, *args, **kwargs):
        # Force organization to the admin's organization if they are not super admin
        data = request.data.copy()
        if request.user.role != UserRole.SUPER_ADMIN:
            data['organization'] = request.user.organization_id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = serializer.save()

            # If the user is a driver, instantly link a Driver profile
            if user.role == UserRole.DRIVER:
                from fleet.models import Driver
                Driver.objects.create(
                    user=user,
                    organization=user.organization,
                    license_number=data.get('license_number', 'PENDING'),
                )
            elif user.role in [
                UserRole.EMPLOYEE, UserRole.DISPATCH_MANAGER, 
                UserRole.OPERATIONS_MANAGER, UserRole.INVENTORY_MANAGER, 
                UserRole.FINANCE_MANAGER, UserRole.READ_ONLY
            ]:
                from operations.models import EmployeeProfile
                EmployeeProfile.objects.create(
                    user=user,
                    organization=user.organization,
                    department=data.get('department', 'OPERATIONS'),
                    operational_role=data.get('operational_role', 'STAFF'),
                )

        return Response(
            {
                "success": True,
                "message": "Personnel created successfully.",
                "data": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        admin_password = request.data.get('admin_password')
        if not admin_password or not request.user.check_password(admin_password):
            return Response(
                {"success": False, "message": "Invalid admin password. Deletion aborted."},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return Response(
            {"success": True, "message": "Personnel removed successfully."},
            status=status.HTTP_200_OK,
        )

@extend_schema(tags=['Enterprise Authentication'])
class LogisticsRegistrationView(APIView):
    """
    Handles the 3-step logistics organization onboarding in a single atomic transaction.
    Creates Organization (LOGISTICS_PROVIDER) and Owner User (ADMIN).
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=LogisticsRegistrationSerializer)
    @transaction.atomic
    def post(self, request):
        serializer = LogisticsRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data['email']
        password = data['password']
        
        if User.objects.filter(email=email).exists():
            return Response({"success": False, "message": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Organization Info
        org = Organization.objects.create(
            name=data['company_name'],
            email=email,
            phone_number=data['phone_number'],
            org_type=OrganizationType.LOGISTICS_PROVIDER,
            metadata={
                "registration_number": data.get('registration_number'),
                "gst_number": data.get('gst_number'),
                "company_address": data.get('company_address'),
                "coverage_regions": data.get('coverage_regions'),
                "fleet_size": data.get('fleet_size'),
                "vehicle_types": data.get('vehicle_types'),
                "number_of_drivers": data.get('number_of_drivers'),
            }
        )

        # 2. User Creation (Owner)
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            phone_number=data['phone_number'],
            role=UserRole.ADMIN,
            organization=org,
            is_phone_verified=True
        )

        # Generate Tokens
        refresh = CustomTokenObtainPairSerializer.get_token(user)

        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'organization': user.organization_id,
            'organization_name': org.name,
            'kyc_status': user.kyc_status,
            'requires_password_change': user.requires_password_change,
        }

        return Response({
            "success": True,
            "message": "Logistics organization registered successfully.",
            "data": {
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Enterprise Authentication'])
class ProvisionUserView(APIView):
    """
    Allows an Organization Owner to provision Employee and Driver accounts.
    Returns the created user info.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=ProvisionUserSerializer)
    @transaction.atomic
    def post(self, request):
        if request.user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return Response({"success": False, "message": "Only organization admins can provision users."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProvisionUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data['email']
        password = data['password']
        
        if User.objects.filter(email=email).exists():
            return Response({"success": False, "message": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Determine target organization
        org = request.user.organization
        if request.user.role == UserRole.SUPER_ADMIN and 'organization' in request.data:
            try:
                org = Organization.objects.get(id=request.data['organization'])
            except Organization.DoesNotExist:
                return Response({"success": False, "message": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)

        if not org:
            return Response({"success": False, "message": "Cannot provision user without an organization."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            phone_number=data.get('phone_number', ''),
            role=data['role'],
            organization=org,
            is_phone_verified=True,
            requires_password_change=True # Force password change on first login
        )
        
        # Auto-create related profiles
        if user.role == UserRole.DRIVER:
            from fleet.models import Driver
            license_number = request.data.get('license_number', 'PENDING')
            
            if Driver.objects.filter(license_number=license_number).exists():
                user.delete()
                return Response({"success": False, "message": "A driver with this license number already exists."}, status=status.HTTP_400_BAD_REQUEST)
                
            Driver.objects.create(
                user=user,
                organization=org,
                license_number=license_number,
            )
        elif user.role in [
            UserRole.EMPLOYEE, UserRole.DISPATCH_MANAGER, 
            UserRole.OPERATIONS_MANAGER, UserRole.INVENTORY_MANAGER, 
            UserRole.FINANCE_MANAGER, UserRole.READ_ONLY
        ]:
            from operations.models import EmployeeProfile
            EmployeeProfile.objects.create(
                user=user,
                organization=org,
                department=request.data.get('department', 'OPERATIONS'),
                operational_role=request.data.get('operational_role', 'STAFF'),
            )

        return Response({
            "success": True,
            "message": "User provisioned successfully.",
            "data": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Enterprise Authentication'])
class ChangePasswordView(APIView):
    """
    Allows a user to change their password and resets requires_password_change.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.requires_password_change = False
        user.save()
        
        return Response({
            "success": True,
            "message": "Password updated successfully."
        }, status=status.HTTP_200_OK)
