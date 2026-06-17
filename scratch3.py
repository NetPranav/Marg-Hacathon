import requests
import re

url = "https://marg-hacathon.onrender.com/api/v1/auth/register-factory/"
data = {
    "full_name": "Pranav Dubey",
    "email": "testfactory@example.com",
    "phone_number": "9479436780",
    "password": "password123",
    "confirm_password": "password123",
    "company_name": "Blueverse",
    "industry_type": "FMCG",
    "country": "India",
    "state": "Madhya Pradesh",
    "city": "Dewas",
    "address": "364 Sun City 2 Dewas",
    "pincode": "455001",
    "factory_size": "Medium",
    "daily_volume": "1-50"
}

response = requests.post(url, json=data)
if response.status_code == 500:
    text = response.text
    match = re.search(r'<div id="summary">.*?<h1>(.*?)</h1>.*?<pre class="exception_value">(.*?)</pre>', text, re.DOTALL)
    if match:
        print(match.group(1).strip())
        print(match.group(2).strip())
    else:
        print("Could not parse 500 error summary")
else:
    print(response.status_code, response.text)
