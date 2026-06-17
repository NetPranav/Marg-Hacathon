import requests

url = "http://localhost:8080/api/v1/auth/register-factory/"
data = {
    "full_name": "Pranav Dubey",
    "email": "testfactorylocal2@example.com",
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
print(response.status_code, response.text)
