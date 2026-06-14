from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import AssignmentStatus


class Assignment(TimestampMixin, models.Model):
    """
    Represents the assignment of a Driver + Truck to a Shipment.
    Includes intelligent scoring breakdown for the recommendation engine.
    """
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='assignments',
    )
    driver = models.ForeignKey(
        'fleet.Driver',
        on_delete=models.CASCADE,
        related_name='assignments',
    )
    truck = models.ForeignKey(
        'fleet.Truck',
        on_delete=models.CASCADE,
        related_name='assignments',
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_assignments',
    )
    status = models.CharField(
        max_length=20,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.PROPOSED,
    )

    # Scoring breakdown (0–100 for each, weighted into compatibility_score)
    compatibility_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Overall weighted compatibility score (0-100)',
    )
    route_experience_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Score based on past trips on same route (30% weight)',
    )
    proximity_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Score based on distance to pickup (25% weight)',
    )
    vehicle_match_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Score based on truck type + capacity match (20% weight)',
    )
    driver_rating_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Score based on driver performance rating (15% weight)',
    )
    fuel_efficiency_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Score based on fuel efficiency (10% weight)',
    )

    notes = models.TextField(blank=True, default='')
    accepted_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        indexes = [
            models.Index(fields=['shipment', 'status']),
            models.Index(fields=['driver', 'status']),
        ]

    def __str__(self):
        return (
            f"Assignment: {self.driver.user.full_name} + "
            f"{self.truck.registration_number} → "
            f"{self.shipment.shipment_number} (score: {self.compatibility_score})"
        )
