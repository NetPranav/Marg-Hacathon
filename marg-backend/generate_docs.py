import json
import os

with open('backend_schema.json', 'r') as f:
    data = json.load(f)

schema = data['schema']
urls = data['urls']

apps_dir = [d for d in os.listdir('.') if os.path.isdir(d) and os.path.exists(os.path.join(d, 'models.py'))]

md = "# Backend Architecture & Data Schema\n\n"
md += "This document provides a comprehensive overview of the backend structure, logic, and data schema.\n\n"

md += "## Overall Structure\n"
md += "The backend is built using Django and Django REST Framework. It is structured into multiple decoupled apps, each responsible for a specific domain of the logistics platform.\n\n"

md += "## Applications & Data Schema\n\n"

for app_name, app_data in schema.items():
    if not app_data.get('models'):
        continue
    
    md += f"### {app_name.capitalize()}\n"
    md += f"**Responsibilities:** Handles data and logic related to {app_name}.\n\n"
    
    md += "#### Models\n"
    for model_name, model_info in app_data['models'].items():
        md += f"- **{model_name}**\n"
        for field in model_info['fields']:
            field_desc = f"  - `{field['name']}`: {field['type']}"
            if field.get('related_model'):
                field_desc += f" (Foreign Key to {field['related_model']})"
            md += field_desc + "\n"
    md += "\n"

md += "## API Endpoints\n\n"
md += "The following URL patterns are exposed by the backend:\n\n"
for url in sorted(urls):
    if not url.startswith('^__debug__') and not url.startswith('^admin/'):
        clean_url = url.replace('^', '/').replace('$', '').replace('\\', '').replace('(?P<', '{').replace('>[^/.]+)', '}')
        md += f"- `{clean_url}`\n"

with open('../backend_explanation.md', 'w') as f:
    f.write(md)
