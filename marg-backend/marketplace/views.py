from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MarketplaceLoad, MarketplaceBid
from .serializers import LotSerializer, LotCreateSerializer, QuoteSerializer
from common.enums import MarketplaceLoadStatus

class LotsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for factory managers to manage 'Lots' (Job Postings).
    Maps to /api/v1/lots/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.organization and user.organization.org_type == 'FACTORY':
            return MarketplaceLoad.objects.filter(posted_by=user).order_by('-created_at')
        return MarketplaceLoad.objects.filter(status=MarketplaceLoadStatus.AVAILABLE).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return LotCreateSerializer
        return LotSerializer

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)


class LogisticsQuotesViewSet(viewsets.ModelViewSet):
    """
    API endpoint for submitting quotes on lots and accepting them.
    Maps to /api/v1/logistics/quotes/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuoteSerializer

    def get_queryset(self):
        user = self.request.user
        if user.organization and user.organization.org_type == 'FACTORY':
            # Factory sees all quotes for their lots
            return MarketplaceBid.objects.filter(load__posted_by=user)
        elif user.organization:
            # Logistics company sees their own quotes
            return MarketplaceBid.objects.filter(bidder=user.organization)
        return MarketplaceBid.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(bid_by=user, bidder=user.organization)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Factory accepts a quotation."""
        quote = self.get_object()
        load = quote.load
        
        # Verify permissions
        if load.posted_by != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        if quote.is_accepted:
            return Response({"detail": "Quote already accepted."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Accept the quote
        from django.utils import timezone
        quote.is_accepted = True
        quote.accepted_at = timezone.now()
        quote.save()
        
        # Update load status
        load.status = MarketplaceLoadStatus.ACCEPTED
        load.locked_by = quote.bidder
        load.locked_at = timezone.now()
        load.save()
        
        return Response({"success": True, "message": "Quotation accepted, shipment triggered."})
