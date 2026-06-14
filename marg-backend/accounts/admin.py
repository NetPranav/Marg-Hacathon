from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the Marg User model (email-based auth)."""
    list_display = ('email', 'first_name', 'last_name', 'role', 'organization', 'is_active')
    list_filter = ('role', 'is_active', 'organization')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    # Override fieldsets to remove username
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number')}),
        ('Platform', {'fields': ('role', 'organization')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'password1', 'password2', 'role', 'organization'),
        }),
    )
