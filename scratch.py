import requests

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
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
