import os
import django
from django.conf import settings
from django.apps import apps
from django.urls import get_resolver
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marg_backend.settings')
django.setup()

schema = {}

for app in apps.get_app_configs():
    if not app.name.startswith('django.') and not app.name.startswith('rest_framework') and not app.name in ['corsheaders', 'channels']:
        schema[app.name] = {
            "models": {}
        }
        for model in app.get_models():
            model_info = {
                "fields": []
            }
            for field in model._meta.get_fields():
                field_info = {
                    "name": field.name,
                    "type": field.get_internal_type() if hasattr(field, 'get_internal_type') else type(field).__name__
                }
                if field.is_relation:
                    field_info["related_model"] = field.related_model.__name__ if field.related_model else None
                model_info["fields"].append(field_info)
            schema[app.name]["models"][model.__name__] = model_info

urls = []
def get_urls(url_patterns, prefix=''):
    for pattern in url_patterns:
        if hasattr(pattern, 'url_patterns'):
            get_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            urls.append(prefix + str(pattern.pattern))

try:
    resolver = get_resolver()
    get_urls(resolver.url_patterns)
except Exception as e:
    urls.append(str(e))

output = {
    "schema": schema,
    "urls": urls
}

with open('backend_schema.json', 'w') as f:
    json.dump(output, f, indent=2)
