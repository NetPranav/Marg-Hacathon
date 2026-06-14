import os
import sys
import django

sys.path.append('/Users/pranav/Project Folder/Marg/marg-backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marg_backend.settings')
django.setup()

from logistics.models import LogisticsCompany

def seed_logistics():
    companies = [
        {
            'name': 'Gati KWE Logistics',
            'contact_email': 'info@gatikwe.com',
            'contact_phone': '+91 9876543210',
            'rating': 4.8,
            'fleet_size': 250,
            'coverage_regions': ['Maharashtra', 'Gujarat', 'Delhi'],
            'average_response_time_mins': 15,
            'completed_jobs': 1204
        },
        {
            'name': 'Blue Dart Express',
            'contact_email': 'contact@bluedart.com',
            'contact_phone': '+91 8765432109',
            'rating': 4.9,
            'fleet_size': 500,
            'coverage_regions': ['All India'],
            'average_response_time_mins': 10,
            'completed_jobs': 5430
        },
        {
            'name': 'Delhivery',
            'contact_email': 'sales@delhivery.com',
            'contact_phone': '+91 7654321098',
            'rating': 4.5,
            'fleet_size': 800,
            'coverage_regions': ['All India'],
            'average_response_time_mins': 25,
            'completed_jobs': 8900
        },
        {
            'name': 'Rivigo Freight',
            'contact_email': 'freight@rivigo.com',
            'contact_phone': '+91 6543210987',
            'rating': 4.6,
            'fleet_size': 150,
            'coverage_regions': ['Maharashtra', 'Karnataka', 'Tamil Nadu'],
            'average_response_time_mins': 20,
            'completed_jobs': 750
        },
    ]

    for data in companies:
        LogisticsCompany.objects.update_or_create(
            name=data['name'],
            defaults=data
        )
        print(f"Created/Updated {data['name']}")

if __name__ == '__main__':
    seed_logistics()
    print("Seed complete.")
