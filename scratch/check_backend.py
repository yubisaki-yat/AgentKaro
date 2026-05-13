import requests
import time

def check_backend():
    url = "http://127.0.0.1:8000/api/status?email=nitisk34532@gmail.com"
    try:
        start = time.time()
        res = requests.get(url, timeout=5)
        end = time.time()
        print(f"Status check: {res.status_code} in {end-start:.2f}s")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_backend()
