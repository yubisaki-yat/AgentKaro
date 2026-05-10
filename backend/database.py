import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Connection Helper
def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if not url:
        # Fallback for local development or if not set yet
        print("[WARNING] DATABASE_URL missing! Please set it in .env")
        return None
    
    try:
        conn = psycopg2.connect(url, cursor_factory=RealDictCursor, connect_timeout=10)
        conn.autocommit = True
        # Set a query timeout of 10 seconds
        with conn.cursor() as cur:
            cur.execute("SET statement_timeout = 10000")
        return conn
    except Exception as e:
        print(f"[CRITICAL ERROR] Failed to connect to PostgreSQL: {e}")
        return None

class MongoDB:
    """
    PostgreSQL Implementation (Kept name 'MongoDB' to avoid breaking main.py imports)
    """

    @staticmethod
    async def get_user(email: str):
        conn = get_db_connection()
        if not conn: return None
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                return cur.fetchone()
        except Exception as e:
            print(f"[DB ERROR] get_user failed: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    async def create_user(email: str, hashed_password: str = None, source: str = "local"):
        conn = get_db_connection()
        if not conn: return None
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                new_user = {
                    "email": email,
                    "password_hash": hashed_password,
                    "source": source,
                    "subscription_level": "free",
                    "is_active": True,
                    "created_at": datetime.utcnow()
                }
                
                # Check if user exists first to avoid conflict
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                existing = cur.fetchone()
                if existing:
                    return existing

                columns = new_user.keys()
                values = [new_user[column] for column in columns]
                insert_query = f"INSERT INTO users ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(columns))}) RETURNING *"
                
                cur.execute(insert_query, values)
                user_row = cur.fetchone()
                
                # Initialize usage and settings
                cur.execute("INSERT INTO usage (email, counts) VALUES (%s, %s) ON CONFLICT (email) DO NOTHING", (email, Json({})))
                cur.execute("INSERT INTO settings (email, data) VALUES (%s, %s) ON CONFLICT (email) DO NOTHING", (email, Json({})))
                
                return user_row
        except Exception as e:
            import traceback
            error_msg = f"[DB ERROR] create_user failed for {email}: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            # Write to a file for the agent to see
            with open("db_error.log", "a") as f:
                f.write(error_msg + "\n")
            return None
        finally:
            conn.close()

    @staticmethod
    async def update_subscription(email: str, level: str, expiry: datetime = None):
        conn = get_db_connection()
        if not conn: return
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                if expiry:
                    cur.execute("UPDATE users SET subscription_level = %s, subscription_expiry = %s WHERE email = %s", (level, expiry, email))
                else:
                    cur.execute("UPDATE users SET subscription_level = %s WHERE email = %s", (level, email))
        except Exception as e:
            print(f"[DB ERROR] update_subscription failed: {e}")
        finally:
            conn.close()

    @staticmethod
    async def get_usage(email: str):
        conn = get_db_connection()
        if not conn: return None
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                cur.execute("SELECT * FROM usage WHERE email = %s", (email,))
                return cur.fetchone()
        except Exception as e:
            print(f"[DB ERROR] get_usage failed: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    async def increment_usage(email: str, platform: str):
        conn = get_db_connection()
        if not conn: return
        try:
            # Atomic increment in Postgres
            with conn.cursor() as cur:
                email = email.lower().strip()
                
                # Get current counts first or use jsonb_set for atomic update if using jsonb
                # For simplicity with RealDictCursor and standard JSON:
                cur.execute("SELECT counts FROM usage WHERE email = %s", (email,))
                row = cur.fetchone()
                counts = row['counts'] if row and row['counts'] else {}
                if isinstance(counts, str): counts = json.loads(counts)
                
                counts[platform] = counts.get(platform, 0) + 1
                
                cur.execute(
                    "UPDATE usage SET counts = %s, last_updated = %s WHERE email = %s",
                    (Json(counts), datetime.utcnow(), email)
                )
        except Exception as e:
            print(f"[DB ERROR] increment_usage failed: {e}")
        finally:
            conn.close()

    @staticmethod
    async def get_settings(email: str):
        conn = get_db_connection()
        if not conn: return {}
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                cur.execute("SELECT data FROM settings WHERE email = %s", (email,))
                row = cur.fetchone()
                return row['data'] if row and row['data'] else {}
        except Exception as e:
            print(f"[DB ERROR] get_settings failed: {e}")
            return {}
        finally:
            conn.close()

    @staticmethod
    async def save_settings(email: str, data: dict):
        conn = get_db_connection()
        if not conn: return
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                cur.execute(
                    "INSERT INTO settings (email, data, updated_at) VALUES (%s, %s, %s) "
                    "ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at",
                    (email, Json(data), datetime.utcnow())
                )
        except Exception as e:
            print(f"[DB ERROR] save_settings failed: {e}")
        finally:
            conn.close()

    @staticmethod
    async def add_application(email: str, app_data: dict):
        conn = get_db_connection()
        if not conn: return
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                app_data["email"] = email
                if "applied_at" not in app_data:
                    app_data["applied_at"] = datetime.utcnow()
                
                columns = app_data.keys()
                values = [app_data[column] if not isinstance(app_data[column], dict) else Json(app_data[column]) for column in columns]
                
                insert_query = f"INSERT INTO applications ({', '.join(columns)}) VALUES ({', '.join(['%s'] * len(columns))})"
                cur.execute(insert_query, values)
        except Exception as e:
            print(f"[DB ERROR] add_application failed: {e}")
        finally:
            conn.close()

    @staticmethod
    async def get_applications(email: str, platform: str = None):
        conn = get_db_connection()
        if not conn: return []
        try:
            with conn.cursor() as cur:
                email = email.lower().strip()
                if platform:
                    cur.execute(
                        "SELECT * FROM applications WHERE email = %s AND platform = %s ORDER BY applied_at DESC LIMIT 100",
                        (email, platform)
                    )
                else:
                    cur.execute(
                        "SELECT * FROM applications WHERE email = %s ORDER BY applied_at DESC LIMIT 100",
                        (email,)
                    )
                return cur.fetchall()
        except Exception as e:
            print(f"[DB ERROR] get_applications failed: {e}")
            return []
        finally:
            conn.close()
