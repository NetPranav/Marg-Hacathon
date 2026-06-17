import requests

url = "https://marg-hacathon.onrender.com/api/v1/auth/register-factory/"
data = {
    "full_name": "Pranav Dubey",
    "email": "testfactory2@example.com",
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
    for line in response.text.split('\n'):
        if "Exception" in line or "Error" in line or "Traceback" in line:
            print(line.strip()[:200])
else:
    print(response.status_code, response.text)
