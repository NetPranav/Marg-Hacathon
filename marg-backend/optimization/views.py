from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.enums import UserRole, RecommendationStatus
from .models import DockRecommendation, ReturnLoad
from .serializers import (
    DockRecommendationSerializer, ReturnLoadSerializer,
)
from .services.return_load_service import accept_return_load, decline_return_load


@extend_schema_view(
    list=extend_schema(tags=['Dock Recommendations'], summary='List dock recommendations'),
    retrieve=extend_schema(tags=['Dock Recommendations'], summary='Get recommendation detail'),
)
class DockRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """Dock optimization recommendations for warehouse managers."""
    serializer_class = DockRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['recommendation_type', 'status', 'warehouse']

    def get_queryset(self):
        user = self.request.user
        qs = DockRecommendation.objects.select_related('warehouse', 'resolved_by')
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        if user.organization:
            return qs.filter(warehouse__organization=user.organization)
        return qs.none()

    @extend_schema(tags=['Dock Recommendations'], summary='Approve a recommendation')
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        rec = self.get_object()
        if rec.status != RecommendationStatus.PENDING:
            return Response(
                {'success': False, 'message': 'Recommendation already resolved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rec.status = RecommendationStatus.APPROVED
        rec.resolved_by = request.user
        rec.resolved_at = timezone.now()
        rec.save(update_fields=['status', 'resolved_by', 'resolved_at', 'updated_at'])
        return Response({'success': True, 'message': 'Recommendation approved.'})

    @extend_schema(tags=['Dock Recommendations'], summary='Reject a recommendation')
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        rec = self.get_object()
        if rec.status != RecommendationStatus.PENDING:
            return Response(
                {'success': False, 'message': 'Recommendation already resolved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        rec.status = RecommendationStatus.REJECTED
        rec.resolved_by = request.user
        rec.resolved_at = timezone.now()
        rec.save(update_fields=['status', 'resolved_by', 'resolved_at', 'updated_at'])
        return Response({'success': True, 'message': 'Recommendation rejected.'})


@extend_schema_view(
    list=extend_schema(tags=['Return Loads'], summary='List return-load opportunities'),
    retrieve=extend_schema(tags=['Return Loads'], summary='Get return-load detail'),
)
class ReturnLoadViewSet(viewsets.ReadOnlyModelViewSet):
    """Return-load marketplace for drivers."""
    serializer_class = ReturnLoadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        qs = ReturnLoad.objects.select_related(
            'original_shipment', 'return_shipment', 'return_shipment__factory',
            'truck', 'driver', 'driver__user',
        )
        if user.role == UserRole.DRIVER:
            return qs.filter(driver__user=user)
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        if user.organization:
            return qs.filter(truck__organization=user.organization)
        return qs.none()

    @extend_schema(tags=['Return Loads'], summary='Accept a return-load opportunity')
    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        return_load = self.get_object()
        try:
            accept_return_load(return_load, request.user)
        except Exception as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({
            'success': True,
            'message': 'Return load accepted. Factory has been notified.',
        })

    @extend_schema(tags=['Return Loads'], summary='Decline a return-load opportunity')
    @action(detail=True, methods=['post'], url_path='decline')
    def decline(self, request, pk=None):
        return_load = self.get_object()
        decline_return_load(return_load)
        return Response({'success': True, 'message': 'Return load declined.'})
