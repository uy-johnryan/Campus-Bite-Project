import requests

API_URL = "http://127.0.0.1:5000"

# Replace these with your actual test account and menu item IDs
USER_ID = 1
ITEM_ID = 1

# Add favorite
response = requests.post(
    f"{API_URL}/api/users/{USER_ID}/favorites",
    json={"item_id": ITEM_ID}
)

print("ADD FAVORITE:")
print(response.status_code, response.json())


# Retrieve favorites
response = requests.get(
    f"{API_URL}/api/users/{USER_ID}/favorites"
)

print("\nGET FAVORITES:")
print(response.status_code, response.json())


# Remove favorite
response = requests.delete(
    f"{API_URL}/api/users/{USER_ID}/favorites/{ITEM_ID}"
)

print("\nREMOVE FAVORITE:")
print(response.status_code, response.json())