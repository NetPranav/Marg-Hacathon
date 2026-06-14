from rest_framework import serializers
from .models import MarketplaceLoad, MarketplaceBid
from organizations.models import Organization

class OrganizationBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'org_type', 'is_verified']

class LotSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.CharField(source='posted_by.full_name', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.name', read_only=True)
    
    class Meta:
        model = MarketplaceLoad
        fields = '__all__'
        read_only_fields = ('status', 'posted_by', 'locked_by', 'locked_at')

class LotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceLoad
        fields = [
            'title', 'origin_name', 'destination_name', 'origin_lat', 'origin_lng',
            'dest_lat', 'dest_lng', 'cargo_type', 'weight_kg', 'rate_per_km',
            'total_distance_km', 'estimated_revenue', 'load_type', 'vehicle_type_required',
            'expires_at'
        ]

class QuoteSerializer(serializers.ModelSerializer):
    bidder_details = OrganizationBasicSerializer(source='bidder', read_only=True)
    
    class Meta:
        model = MarketplaceBid
        fields = '__all__'
        read_only_fields = ('is_accepted', 'accepted_at', 'bid_by', 'bidder')
