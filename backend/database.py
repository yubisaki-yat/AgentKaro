import os
from datetime import datetime
from supabase import create_client, Client
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Lazy Supabase Client Initialization
_supabase_instance: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global _supabase_instance
    if _supabase_instance is not None:
        return _supabase_instance
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("[WARNING] Supabase credentials missing (URL or Key)!")
        return None
        
    try:
        # Sanitize keys (remove whitespace/quotes if user pasted them poorly)
        url = url.strip().strip("'").strip('"')
        key = key.strip().strip("'").strip('"')
        
        _supabase_instance = create_client(url, key)
        print(f"[DB] Supabase initialized for: {url}")
        return _supabase_instance
    except Exception as e:
        print(f"[CRITICAL ERROR] Failed to initialize Supabase client: {e}")
        return None

class MongoDB:
    """
    Supabase Implementation (Kept name 'MongoDB' to avoid breaking main.py imports)
    """

    @staticmethod
    async def get_user(email: str):
        client = get_supabase_client()
        if not client: return None
        email = email.lower().strip()
        response = client.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def create_user(email: str, hashed_password: str = None, source: str = "local"):
        client = get_supabase_client()
        if not client: 
            print("[ERROR] Supabase client not initialized!")
            return None
        try:
            email = email.lower().strip()
            new_user = {
                "email": email,
                "password_hash": hashed_password,
                "source": source,
                "subscription_level": "free",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            res = client.table("users").insert(new_user).execute()
            if not res.data:
                print(f"[DB] Insert failed for {email}: No data returned")
                return None
            
            # These are secondary, we can ignore failure here or log it
            try: client.table("usage").insert({"email": email}).execute()
            except: pass
            
            try: client.table("settings").insert({"email": email, "data": {}}).execute()
            except: pass
            
            return new_user
        except Exception as e:
            print(f"[DB ERROR] create_user failed for {email}: {e}")
            return None

    @staticmethod
    async def update_subscription(email: str, level: str, expiry: datetime = None):
        client = get_supabase_client()
        if not client: return
        email = email.lower().strip()
        update_data = {"subscription_level": level}
        if expiry:
            update_data["subscription_expiry"] = expiry.isoformat()
        
        client.table("users").update(update_data).eq("email", email).execute()

    @staticmethod
    async def get_usage(email: str):
        client = get_supabase_client()
        if not client: return None
        email = email.lower().strip()
        response = client.table("usage").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def increment_usage(email: str, platform: str):
        client = get_supabase_client()
        if not client: return
        email = email.lower().strip()
        
        # Get current counts
        current = await MongoDB.get_usage(email)
        if not current: return
        
        counts = current.get("counts", {})
        counts[platform] = counts.get(platform, 0) + 1
        
        client.table("usage").update({
            "counts": counts, 
            "last_updated": datetime.utcnow().isoformat()
        }).eq("email", email).execute()

    @staticmethod
    async def get_settings(email: str):
        client = get_supabase_client()
        if not client: return {}
        email = email.lower().strip()
        response = client.table("settings").select("data").eq("email", email).execute()
        return response.data[0]["data"] if response.data else {}

    @staticmethod
    async def save_settings(email: str, data: dict):
        client = get_supabase_client()
        if not client: return
        email = email.lower().strip()
        client.table("settings").upsert({
            "email": email, 
            "data": data, 
            "updated_at": datetime.utcnow().isoformat()
        }).execute()

    @staticmethod
    async def add_application(email: str, app_data: dict):
        client = get_supabase_client()
        if not client: return
        email = email.lower().strip()
        app_data["email"] = email
        app_data["applied_at"] = datetime.utcnow().isoformat()
        client.table("applications").insert(app_data).execute()

    @staticmethod
    async def get_applications(email: str, platform: str = None):
        client = get_supabase_client()
        if not client: return []
        email = email.lower().strip()
        query = client.table("applications").select("*").eq("email", email)
        if platform:
            query = query.eq("platform", platform)
        
        response = query.order("applied_at", desc=True).limit(100).execute()
        return response.data if response.data else []
