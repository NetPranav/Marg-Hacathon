import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marg_backend.settings')
django.setup()

from shipments.models import Lot

updated_count = 0
for lot in Lot.objects.filter(factory_id=1):
    creator = lot.created_by
    if creator and creator.organization:
        actual_factory = creator.organization.factories.first()
        if actual_factory and actual_factory.id != 1:
            lot.factory = actual_factory
            lot.save(update_fields=['factory'])
            updated_count += 1
            print(f"Updated Lot {lot.id} to use Factory {actual_factory.name} (ID: {actual_factory.id})")

print(f"Fixed {updated_count} lots.")
