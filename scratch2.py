import requests
from bs4 import BeautifulSoup

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
    soup = BeautifulSoup(response.text, 'html.parser')
    print("500 Error Exception:")
    print(soup.find('div', id='summary').text if soup.find('div', id='summary') else "No summary")
    print(soup.find('div', id='traceback').text if soup.find('div', id='traceback') else "No traceback")
else:
    print(response.status_code, response.text)
