import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load .env
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
load_dotenv(ENV_FILE)

def check_user():
    url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(url, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            email = "nitisk34532@gmail.com"
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            print(f"User '{email}': {'FOUND' if user else 'NOT FOUND'}")
            if user:
                print(f"Details: {user}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_user()
