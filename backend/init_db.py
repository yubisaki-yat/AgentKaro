import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def init_db():
    url = os.getenv("DATABASE_URL")
    if not url or "user:password" in url:
        print("[ERROR] DATABASE_URL is not set correctly in .env. Please add your Neon/Aiven URL.")
        return

    try:
        conn = psycopg2.connect(url)
        conn.autocommit = True
        cur = conn.cursor()

        print("[INIT] Creating tables...")

        # 1. Users Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password_hash TEXT,
                source TEXT DEFAULT 'local',
                subscription_level TEXT DEFAULT 'free',
                subscription_expiry TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Usage Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usage (
                email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
                counts JSONB DEFAULT '{}',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Settings Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
                data JSONB DEFAULT '{}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Applications Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                email TEXT REFERENCES users(email) ON DELETE CASCADE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                platform TEXT,
                job_title TEXT,
                company TEXT,
                location TEXT,
                status TEXT,
                raw_data JSONB DEFAULT '{}'
            );
        """)

        print("[SUCCESS] Database initialized successfully!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")

if __name__ == "__main__":
    init_db()
