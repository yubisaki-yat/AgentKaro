import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load .env
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
load_dotenv(ENV_FILE)

def check_settings():
    url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(url, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            email = "nitisk34532@gmail.com"
            cur.execute("SELECT * FROM settings WHERE email = %s", (email,))
            row = cur.fetchone()
            print(f"Settings for '{email}': {'FOUND' if row else 'NOT FOUND'}")
            if row:
                print(f"Data: {row['data']}")
                print(f"Updated At: {row['updated_at']}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_settings()
