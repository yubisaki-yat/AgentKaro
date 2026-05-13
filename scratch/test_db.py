import os
import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime

# Load .env
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
load_dotenv(ENV_FILE)

def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("[ERROR] DATABASE_URL missing!")
        return None
    try:
        conn = psycopg2.connect(url, cursor_factory=RealDictCursor, connect_timeout=10)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"[CRITICAL ERROR] Failed to connect to PostgreSQL: {e}")
        return None

async def test_save_settings(email, data):
    conn = get_db_connection()
    if not conn:
        print("Could not connect to DB")
        return
    try:
        with conn.cursor() as cur:
            email = email.lower().strip()
            print(f"Saving settings for {email}...")
            cur.execute(
                "INSERT INTO settings (email, data, updated_at) VALUES (%s, %s, %s) "
                "ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at",
                (email, Json(data), datetime.utcnow())
            )
            print("Save executed successfully")
            
            # Verify
            cur.execute("SELECT data FROM settings WHERE email = %s", (email,))
            row = cur.fetchone()
            print(f"Verified data: {row['data'] if row else 'NOT FOUND'}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    email = "nitisk34532@gmail.com"
    data = {"test_key": "test_value", "updated_at": str(datetime.now())}
    asyncio.run(test_save_settings(email, data))
