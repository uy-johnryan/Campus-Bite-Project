import requests

url = "http://127.0.0.1:5000/api/register"

data = {
    "username": "Test Student",
    "email": "teststudent2@my.xu.edu.ph",
    "password": "student123"
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response:", response.json())