"""
WebSocket consumer for real-time dashboard updates.

Channel groups:
- factory_{organization_id}  → Factory managers
- warehouse_{warehouse_id}   → Warehouse managers
- driver_{driver_id}          → Individual drivers
"""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from common.enums import UserRole


class DashboardConsumer(AsyncJsonWebsocketConsumer):
    """
    General-purpose dashboard consumer.
    Clients connect and are automatically subscribed to the appropriate
    channel group based on their role and organization.
    """

    async def connect(self):
        self.user = self.scope.get('user')
        self.groups_joined = []

        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Determine which groups to join based on role
        role = await self._get_user_role()

        # Existing role support
        if role == UserRole.FACTORY_MANAGER:
            org_id = await self._get_org_id()
            if org_id:
                group = f'factory_{org_id}'
                await self.channel_layer.group_add(group, self.channel_name)
                self.groups_joined.append(group)

        elif role == UserRole.WAREHOUSE_MANAGER:
            org_id = await self._get_org_id()
            if org_id:
                group = f'warehouse_org_{org_id}'
                await self.channel_layer.group_add(group, self.channel_name)
                self.groups_joined.append(group)

        elif role == UserRole.DRIVER:
            driver_id = await self._get_driver_id()
            if driver_id:
                group = f'driver_{driver_id}'
                await self.channel_layer.group_add(group, self.channel_name)
                self.groups_joined.append(group)
                
        # Enterprise Platform — New role support
        if role in (UserRole.ADMIN, UserRole.EMPLOYEE):
            org_id = await self._get_org_id()
            if org_id:
                # Both admins and employees get company-wide events
                group = f'company_{org_id}'
                await self.channel_layer.group_add(group, self.channel_name)
                self.groups_joined.append(group)
                
            if role == UserRole.EMPLOYEE:
                # Employees get personal task updates
                group = f'employee_{self.user.id}'
                await self.channel_layer.group_add(group, self.channel_name)
                self.groups_joined.append(group)

        if role in (UserRole.SUPER_ADMIN, UserRole.ADMIN):
            # Global updates for super admins
            # Admins also get a global channel for their org
            admin_group = 'admin_global' if role == UserRole.SUPER_ADMIN else f'admin_{await self._get_org_id()}'
            await self.channel_layer.group_add(admin_group, self.channel_name)
            self.groups_joined.append(admin_group)

        await self.accept()
        await self.send_json({
            'type': 'connection_established',
            'groups': self.groups_joined,
        })

    async def disconnect(self, close_code):
        for group in self.groups_joined:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        """Handle incoming messages from clients (e.g., ping)."""
        msg_type = content.get('type', '')
        if msg_type == 'ping':
            await self.send_json({'type': 'pong'})

    # ─── Event handlers (called when messages arrive on group channels) ──

    async def shipment_update(self, event):
        """Broadcast shipment status changes."""
        await self.send_json(event)

    async def telemetry_update(self, event):
        """Broadcast truck location updates."""
        await self.send_json(event)

    async def dock_recommendation(self, event):
        """Broadcast dock optimization recommendations."""
        await self.send_json(event)

    async def return_load_update(self, event):
        """Broadcast return-load match notifications."""
        await self.send_json(event)

    async def eta_update(self, event):
        """Broadcast ETA prediction updates."""
        await self.send_json(event)

    async def notification_push(self, event):
        """Push a real-time notification."""
        await self.send_json(event)

    # New Event Handlers
    async def assignment_update(self, event):
        await self.send_json(event)

    async def milestone_update(self, event):
        await self.send_json(event)
        
    async def dock_assignment(self, event):
        await self.send_json(event)
        
    async def system_alert(self, event):
        await self.send_json(event)

    # ─── Helper methods ──────────────────────────────────────────────────

    @database_sync_to_async
    def _get_user_role(self):
        return self.user.role

    @database_sync_to_async
    def _get_org_id(self):
        return self.user.organization_id

    @database_sync_to_async
    def _get_driver_id(self):
        profile = getattr(self.user, 'driver_profile', None)
        return profile.id if profile else None


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumer for shipment-scoped chat threads.
    """
    async def connect(self):
        self.user = self.scope.get('user')
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_{self.thread_id}'

        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        # TODO: Add thread participant verification here
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def chat_message(self, event):
        """Receive a message from the channel group."""
        await self.send_json(event)


class TelemetryConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumer for high-frequency GPS streaming (Admin Fleet Map).
    """
    async def connect(self):
        self.user = self.scope.get('user')
        
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Both Logistics and Factory Admins can view telemetry
        org_id = await self._get_org_id()
        org_type = await self._get_org_type()
        
        if org_id:
            if org_type == 'FACTORY':
                self.room_group_name = f'factory_{org_id}'
            else:
                self.room_group_name = f'fleet_{org_id}'
                
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close(code=4000)

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def telemetry_update(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def _get_org_id(self):
        return self.user.organization_id

    @database_sync_to_async
    def _get_org_type(self):
        if self.user.organization:
            return self.user.organization.org_type
        return None
