import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "jobagent_ai"

client = AsyncIOMotorClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000
)
db = client[DB_NAME]

# Collections Mapping
users = db.users
settings = db.settings
usage = db.usage
applications = db.applications

class MongoDB:
    @staticmethod
    async def get_user(email: str):
        return await users.find_one({"email": email.lower().strip()})

    @staticmethod
    async def create_user(email: str, hashed_password: str = None, source: str = "local"):
        email = email.lower().strip()
        new_user = {
            "email": email,
            "hashed_password": hashed_password,
            "source": source, # local, google
            "subscription_level": "free",
            "subscription_expiry": None,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await users.insert_one(new_user)
        # Initialize usage counts
        platforms = ["internshala", "naukri", "indeed", "company_crawler"]
        await usage.insert_one({
            "email": email,
            "counts": {p: 0 for p in platforms},
            "last_updated": datetime.utcnow()
        })
        return new_user

    @staticmethod
    async def update_subscription(email: str, level: str, expiry: datetime = None):
        await users.update_one(
            {"email": email.lower().strip()},
            {"$set": {"subscription_level": level, "subscription_expiry": expiry}}
        )

    @staticmethod
    async def get_usage(email: str):
        return await usage.find_one({"email": email.lower().strip()})

    @staticmethod
    async def increment_usage(email: str, platform: str):
        await usage.update_one(
            {"email": email.lower().strip()},
            {"$inc": {f"counts.{platform}": 1}, "$set": {"last_updated": datetime.utcnow()}}
        )

    @staticmethod
    async def get_settings(email: str):
        doc = await settings.find_one({"email": email.lower().strip()})
        return doc.get("data", {}) if doc else {}

    @staticmethod
    async def save_settings(email: str, data: dict):
        await settings.update_one(
            {"email": email.lower().strip()},
            {"$set": {"data": data, "updated_at": datetime.utcnow()}},
            upsert=True
        )

    @staticmethod
    async def add_application(email: str, app_data: dict):
        app_data["email"] = email.lower().strip()
        app_data["applied_at"] = datetime.utcnow()
        await applications.insert_one(app_data)

    @staticmethod
    async def get_applications(email: str, platform: str = None):
        query = {"email": email.lower().strip()}
        if platform:
            query["platform"] = platform
        return await applications.find(query).sort("applied_at", -1).to_list(length=100)
