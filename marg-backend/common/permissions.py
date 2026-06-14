from rest_framework.permissions import BasePermission
from common.enums import UserRole


class IsSuperAdmin(BasePermission):
    """Allows access only to Super Admin users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.SUPER_ADMIN
        )


class IsFactoryManager(BasePermission):
    """Allows access only to Factory Manager users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.FACTORY_MANAGER
        )


class IsWarehouseManager(BasePermission):
    """Allows access only to Warehouse Manager users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.WAREHOUSE_MANAGER
        )


class IsDriver(BasePermission):
    """Allows access only to Driver users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.DRIVER
        )


class IsAdmin(BasePermission):
    """Allows access only to Admin (logistics company owner) users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsEmployee(BasePermission):
    """Allows access only to Employee (field operations) users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.EMPLOYEE
        )


class IsAdminOrSuperAdmin(BasePermission):
    """Allows access to ADMIN or SUPER_ADMIN users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
        )


class IsAdminOrEmployee(BasePermission):
    """Allows access to ADMIN or EMPLOYEE users."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.EMPLOYEE)
        )


class IsSuperAdminOrReadOnly(BasePermission):
    """Super Admins get full access; authenticated users get read-only."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role == UserRole.SUPER_ADMIN


class IsOrganizationMember(BasePermission):
    """
    Ensures that the user belongs to the same organization as the resource.
    Super Admins bypass this check.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.SUPER_ADMIN:
            return True
        # The object must have an 'organization' attribute
        obj_org = getattr(obj, 'organization', None)
        if obj_org is None:
            # For objects that ARE organizations
            obj_org = obj
        return request.user.organization == obj_org


class IsCompanyMember(BasePermission):
    """
    Ensures user belongs to the same company/org as the resource.
    SUPER_ADMIN and ADMIN with matching org bypass.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.SUPER_ADMIN:
            return True
        obj_org = getattr(obj, 'organization', None)
        if obj_org is None:
            obj_org = obj
        return request.user.organization == obj_org


class IsRoleAllowed(BasePermission):
    """
    Generic permission that checks if the user's role is in the view's
    `allowed_roles` attribute.

    Usage on a ViewSet:
        allowed_roles = [UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER]
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed_roles = getattr(view, 'allowed_roles', [])
        if not allowed_roles:
            return True  # No restriction if not specified
        return request.user.role in allowed_roles
