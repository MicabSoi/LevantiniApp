import requests
import json

url = "http://127.0.0.1:5003/translate"

payload = {
    "text": "ball",
    "context": "sports",
    "gemini_api_key": "AIzaSyBWp8Rof-sn3ag-vwTH4Z4baQw4Q0X3GJU" # <<< REPLACE with your actual Gemini API key
}

headers = {
    'Content-Type': 'application/json'
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    response.raise_for_status() # Raise an exception for bad status codes
    
    print("Status Code:", response.status_code)
    print("Response Body:", json.dumps(response.json(), indent=4))

except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
    print("Please ensure the hybrid_translation_service.py is running on http://127.0.0.1:5003") 