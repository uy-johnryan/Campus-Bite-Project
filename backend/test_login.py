import requests

url = "http://127.0.0.1:5000/api/login"

email = input("Enter email: ")
password = input("Enter password: ")

data = {
    "email": email,
    "password": password
}

response = requests.post(url, json=data)

print("Status Code:", response.status_code)
print("Response:", response.json())
