import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load .env
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
load_dotenv(ENV_FILE)

def check_schema():
    url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(url, cursor_factory=RealDictCursor)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'settings'")
            columns = cur.fetchall()
            print("Settings Table Columns:")
            for col in columns:
                print(f"- {col['column_name']}: {col['data_type']}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
