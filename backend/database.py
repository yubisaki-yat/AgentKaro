import os
from datetime import datetime
from supabase import create_client, Client
from typing import Optional, List

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARNING] Supabase credentials missing!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class MongoDB:
    """
    Supabase Implementation (Kept name 'MongoDB' to avoid breaking main.py imports)
    """

    @staticmethod
    async def get_user(email: str):
        if not supabase: return None
        email = email.lower().strip()
        response = supabase.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def create_user(email: str, hashed_password: str = None, source: str = "local"):
        if not supabase: return None
        email = email.lower().strip()
        new_user = {
            "email": email,
            "password_hash": hashed_password,
            "source": source,
            "subscription_level": "free",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("users").insert(new_user).execute()
        
        # Initialize usage counts
        supabase.table("usage").insert({"email": email}).execute()
        
        # Initialize empty settings
        supabase.table("settings").insert({"email": email, "data": {}}).execute()
        
        return new_user

    @staticmethod
    async def update_subscription(email: str, level: str, expiry: datetime = None):
        if not supabase: return
        email = email.lower().strip()
        update_data = {"subscription_level": level}
        if expiry:
            update_data["subscription_expiry"] = expiry.isoformat()
        
        supabase.table("users").update(update_data).eq("email", email).execute()

    @staticmethod
    async def get_usage(email: str):
        if not supabase: return None
        email = email.lower().strip()
        response = supabase.table("usage").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def increment_usage(email: str, platform: str):
        if not supabase: return
        email = email.lower().strip()
        
        # Get current counts
        current = await MongoDB.get_usage(email)
        if not current: return
        
        counts = current.get("counts", {})
        counts[platform] = counts.get(platform, 0) + 1
        
        supabase.table("usage").update({
            "counts": counts, 
            "last_updated": datetime.utcnow().isoformat()
        }).eq("email", email).execute()

    @staticmethod
    async def get_settings(email: str):
        if not supabase: return {}
        email = email.lower().strip()
        response = supabase.table("settings").select("data").eq("email", email).execute()
        return response.data[0]["data"] if response.data else {}

    @staticmethod
    async def save_settings(email: str, data: dict):
        if not supabase: return
        email = email.lower().strip()
        supabase.table("settings").upsert({
            "email": email, 
            "data": data, 
            "updated_at": datetime.utcnow().isoformat()
        }).execute()

    @staticmethod
    async def add_application(email: str, app_data: dict):
        if not supabase: return
        email = email.lower().strip()
        app_data["email"] = email
        app_data["applied_at"] = datetime.utcnow().isoformat()
        supabase.table("applications").insert(app_data).execute()

    @staticmethod
    async def get_applications(email: str, platform: str = None):
        if not supabase: return []
        email = email.lower().strip()
        query = supabase.table("applications").select("*").eq("email", email)
        if platform:
            query = query.eq("platform", platform)
        
        response = query.order("applied_at", desc=True).limit(100).execute()
        return response.data if response.data else []
