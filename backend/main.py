from pathlib import Path
from dotenv import load_dotenv

# Load Environment Variables BEFORE all other imports
ROOT_DIR = Path(__file__).parent.parent
ENV_FILE = ROOT_DIR / ".env"
load_dotenv(ENV_FILE)

import os
import time
import json
import logging
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta

import pandas as pd
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Body, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
from passlib.context import CryptContext

import hmac
import hashlib
import httpx
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from engines.bot_runner import BotRunner, INTERNSHALA_RUNNER_SCRIPT, NAUKRI_RUNNER_SCRIPT, INDEED_RUNNER_SCRIPT, COMPANY_RUNNER_SCRIPT
from backend.resume_processor import ResumeProcessor
from backend.database import MongoDB

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

app = FastAPI(title="Job Apply Dashboard API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://agentskaro-frontend.onrender.com",
        "https://agentskaro-frontend.onrender.com/",
        "https://agentskaro.onrender.com",
        "https://agentskaro-backend.onrender.com",
        "https://agentskaro.co.in",
        "https://www.agentskaro.co.in",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------
ENGINES_DIR = ROOT_DIR / "engines"
# Global resumes (legacy, keeping for ref but transitioning)
GLOBAL_UPLOAD_DIR = ROOT_DIR / "storage" / "resumes"
GLOBAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Bot instances
runners = {
    "internshala": BotRunner("Internshala Bot"),
    "naukri": BotRunner("Naukri Scraper"),
    "indeed": BotRunner("Indeed Bot"),
    "company_crawler": BotRunner("Company Crawler"),
}

# Razorpay Client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
import razorpay
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Admin Bypass List
ADMIN_EMAILS = ["nitishk38938@gmail.com"]
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "placeholder_google_id")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "placeholder_github_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "placeholder_github_secret")

# Directory for system-wide temp files
TEMP_DIR = ROOT_DIR / "storage" / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# User-specific directory management
def get_user_storage(email: str) -> Path:
    user_path = ROOT_DIR / "storage" / "users" / email
    user_path.mkdir(parents=True, exist_ok=True)
    # Subdirs for logs/resumes/data
    (user_path / "logs").mkdir(exist_ok=True)
    (user_path / "resumes").mkdir(exist_ok=True)
    (user_path / "data").mkdir(exist_ok=True)
    return user_path

# Password Hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Log storage per user/bot
# Structured as: logs_storage[email][bot_id] = []
logs_storage = {}

# ----------------------------------------------------------------
# SCHEMAS
# ----------------------------------------------------------------
class BotConfig(BaseModel):
    email: str
    roles: List[str] = []
    max_applies: int = 20
    keyword: str = ""
    location: str = ""
    max_pages: int = 10
    company_url: Optional[str] = None

class SettingsUpdate(BaseModel):
    data: dict

class CreateSubscriptionRequest(BaseModel):
    email: str
    plan: str

class PaymentVerification(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    razorpay_payment_id: str
    razorpay_signature: str
    email: str
    plan: str

class UserIdentity(BaseModel):
    email: str
    password: Optional[str] = None

class CreateOrderRequest(BaseModel):
    plan: str # monthly, yearly, lifetime
    email: str

class PlatformCountRequest(BaseModel):
    email: str
    platform: str

class GoogleAuthRequest(BaseModel):
    token: str

class GithubAuthRequest(BaseModel):
    code: str

class BrowserActionRequest(BaseModel):
    type: str # reload, click, scroll, navigate, type, back, forward
    email: str
    x: Optional[float] = 0
    y: Optional[float] = 0
    url: Optional[str] = None
    text: Optional[str] = None
    delta_y: Optional[float] = 0

# ----------------------------------------------------------------
# HELPERS (REFACTORED FOR MONGODB)
# ----------------------------------------------------------------
async def load_user_settings(email: str) -> dict:
    return await MongoDB.get_settings(email)

async def save_user_settings(email: str, data: dict):
    await MongoDB.save_settings(email, data)

# ----------------------------------------------------------------
# ROUTES: BOT CONTROL
# ----------------------------------------------------------------
@app.get("/api/status")
async def get_status(email: Optional[str] = None):
    status = {}
    for id, r in runners.items():
        is_owner = email and r.owner_email == email
        status[id] = {
            "running": r.is_running if is_owner else False, 
            "elapsed": r.elapsed() if is_owner else "--:--:--"
        }
    
    if email:
        user = await MongoDB.get_user(email)
        usage_doc = await MongoDB.get_usage(email)
        if user:
            counts = usage_doc.get("counts", {}) if usage_doc else {}
            sub_level = "lifetime" if email in ADMIN_EMAILS else user.get("subscription_level", "free")
            return {"status": status, "subscription": sub_level, "counts": counts}
    return {"status": status}

@app.post("/api/bot/{bot_id}/start")
async def start_bot(bot_id: str, config: BotConfig):
    email = config.email
    if bot_id not in runners:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Check User & Subscription logic merged with Guest check
    user = await MongoDB.get_user(email)
    if not user:
        raise HTTPException(status_code=401, detail="Please login/register to use the bots.")

    # Premium Restriction: Company Crawler is PRO only
    sub_level = "lifetime" if email in ADMIN_EMAILS else user.get("subscription_level", "free")
    if bot_id == "company_crawler" and sub_level == "free":
        raise HTTPException(
            status_code=402, 
            detail="The Company Crawler is a PRO feature. Please upgrade to use it."
        )

    # Check App Limits for Free Tier (Admins bypass all limits)
    if email not in ADMIN_EMAILS and sub_level == "free":
        usage_doc = await MongoDB.get_usage(email)
        if usage_doc:
            current_count = usage_doc.get("counts", {}).get(bot_id, 0)
            if current_count >= 10:
                raise HTTPException(
                    status_code=402, 
                    detail=f"You've reached the free limit of 10 applications for {bot_id}. Upgrade for unlimited access!"
                )
    
    # Load User Settings
    user_settings = await MongoDB.get_settings(email) or {}
    
    # Merge config with stored settings if fields are empty
    roles = config.roles or user_settings.get("PREFERRED_ROLES", "").split(",")
    roles = [r.strip() for r in roles if r.strip()]
    max_applies = config.max_applies or int(user_settings.get("DAILY_APPLY_LIMIT", 20))
    headless = user_settings.get("BOT_HEADLESS") == "true" or user_settings.get("BOT_HEADLESS") == True

    env_overrides = {
        "USER_EMAIL": email,
        "BOT_HEADLESS": "true" if headless else "false",
        # Inject platform credentials from database settings
        "INTERNSHALA_EMAIL": user_settings.get("INTERNSHALA_EMAIL", ""),
        "INTERNSHALA_PASSWORD": user_settings.get("INTERNSHALA_PASSWORD", ""),
        "NAUKRI_EMAIL": user_settings.get("NAUKRI_EMAIL", ""),
        "NAUKRI_PASSWORD": user_settings.get("NAUKRI_PASSWORD", ""),
        "INDEED_EMAIL": user_settings.get("INDEED_EMAIL", ""),
        "INDEED_PASSWORD": user_settings.get("INDEED_PASSWORD", ""),
        # Profile metadata
        "GITHUB_LINK": user_settings.get("GITHUB_LINK", ""),
        "PORTFOLIO_LINK": user_settings.get("PORTFOLIO_LINK", ""),
        "LINKED_LINK": user_settings.get("LINKEDIN_LINK", ""),
        "YEARS_OF_EXPERIENCE": user_settings.get("YEARS_OF_EXPERIENCE", "2"),
        "EXPECTED_CTC": user_settings.get("EXPECTED_CTC", ""),
        "NOTICE_PERIOD": user_settings.get("NOTICE_PERIOD", "Immediate")
    }
    
    runner = runners[bot_id]
    if runner.is_running:
        if runner.owner_email == email:
            return {"status": "already_running"}
        else:
            raise HTTPException(status_code=429, detail="Bot is currently busy serving another user.")

    runner.owner_email = email
    script_content = ""

    user_storage = get_user_storage(email)
    excel_path = user_storage / "data" / f"{bot_id}_applied.xlsx"
    resume_path = user_storage / "resumes" / "latest_resume.pdf" # Default naming policy

    if bot_id == "internshala":
        script_content = INTERNSHALA_RUNNER_SCRIPT
        env_overrides.update({
            "BOT_ENGINES_DIR": str(ENGINES_DIR),
            "BOT_ROLES": ",".join(config.roles or []),
            "BOT_MAX_APPLIES": str(config.max_applies),
            "XLSX_PATH": str(excel_path),
        })
    elif bot_id == "naukri":
        script_content = NAUKRI_RUNNER_SCRIPT
        env_overrides.update({
            "BOT_ENGINES_DIR": str(ENGINES_DIR),
            "NAUKRI_KEYWORDS": ",".join(config.roles or []) if config.roles else config.keyword,
            "NAUKRI_LOCATION": config.location or "",
            "NAUKRI_MAX_PAGES": str(config.max_pages or 10),
            "XLSX_PATH": str(excel_path),
        })
    elif bot_id == "indeed":
        script_content = INDEED_RUNNER_SCRIPT
        env_overrides.update({
            "BOT_ENGINES_DIR": str(ENGINES_DIR),
            "NAUKRI_KEYWORDS": ",".join(config.roles or []) if config.roles else config.keyword,
            "NAUKRI_LOCATION": config.location or "",
            "NAUKRI_MAX_PAGES": str(config.max_pages or 10),
            "XLSX_PATH": str(excel_path),
        })
    elif bot_id == "company_crawler":
        script_content = COMPANY_RUNNER_SCRIPT
        env_overrides.update({
            "BOT_ENGINES_DIR": str(ENGINES_DIR),
            "COMPANY_URL": config.company_url or "",
            "NAUKRI_KEYWORDS": ",".join(config.roles or []) if config.roles else config.keyword,
            "XLSX_PATH": str(excel_path),
        })

    if not script_content:
        raise HTTPException(status_code=400, detail=f"No script defined for bot '{bot_id}'")

    # Mix in user-specific DB settings
    user_settings = await load_user_settings(email)
    env_overrides.update(user_settings)
    
    # Fallback to master .env credentials if user hasn't set them in dashboard
    if bot_id == "internshala":
        if not env_overrides.get("INTERNSHALA_EMAIL"):
            env_overrides["INTERNSHALA_EMAIL"] = os.getenv("INTERNSHALA_EMAIL", "")
        if not env_overrides.get("INTERNSHALA_PASSWORD"):
            env_overrides["INTERNSHALA_PASSWORD"] = os.getenv("INTERNSHALA_PASSWORD", "")
    elif bot_id == "naukri":
        if not env_overrides.get("NAUKRI_EMAIL"):
            env_overrides["NAUKRI_EMAIL"] = os.getenv("NAUKRI_EMAIL", "")
        if not env_overrides.get("NAUKRI_PASSWORD"):
            env_overrides["NAUKRI_PASSWORD"] = os.getenv("NAUKRI_PASSWORD", "")
    elif bot_id == "indeed":
        if not env_overrides.get("INDEED_EMAIL"):
            env_overrides["INDEED_EMAIL"] = os.getenv("INDEED_EMAIL", "")
        if not env_overrides.get("INDEED_PASSWORD"):
            env_overrides["INDEED_PASSWORD"] = os.getenv("INDEED_PASSWORD", "")

    # Ensure no None values in env_overrides
    env_overrides = {k: v if v is not None else "" for k, v in env_overrides.items()}

    print(f"[API] Starting bot '{bot_id}' for {email} with config: {config}")
    try:
        success = runner.start(script_content, env_overrides)
        if success:
            return {"status": "started"}
        else:
            err_msg = "".join(runner.get_new_logs())
            raise HTTPException(status_code=500, detail=f"Runner failed: {err_msg}")
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[CRITICAL] Runner failed for {bot_id}:\n{error_trace}")
        logger.error(f"Error starting bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bot/{bot_id}/stop")
async def stop_bot(bot_id: str, email: str = Body(..., embed=True)):
    if bot_id not in runners:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    runner = runners[bot_id]
    if runner.owner_email != email:
        raise HTTPException(status_code=403, detail="You do not have permission to stop this bot.")
        
    runner.stop()
    return {"status": "stopping"}

# ----------------------------------------------------------------
# ROUTES: LOGS
# ----------------------------------------------------------------
@app.get("/api/bot/{bot_id}/logs")
async def get_logs(bot_id: str, email: str):
    if bot_id not in runners:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    new_logs = runners[bot_id].get_new_logs()
    
    # Initialize user logs if needed
    if email not in logs_storage:
        logs_storage[email] = {"internshala": [], "naukri": [], "indeed": [], "company_crawler": []}
        
    logs_storage[email][bot_id].extend(new_logs)
    logs_storage[email][bot_id] = logs_storage[email][bot_id][-500:]
    return {"logs": logs_storage[email][bot_id]}

@app.get("/api/live-screenshot")
async def get_screenshot(email: str, bot_id: Optional[str] = "internshala"):
    user_storage = get_user_storage(email)
    
    # Try bot-specific first, fallback to generic for backward compatibility
    screenshot_path = user_storage / f"live_{bot_id}.jpg"
    if not screenshot_path.exists():
        screenshot_path = user_storage / "live_view.jpg"
    
    if not screenshot_path.exists():
        raise HTTPException(status_code=404, detail=f"No live preview for {bot_id} available.")
        
    return FileResponse(screenshot_path, media_type="image/jpeg", headers={"Cache-Control": "no-cache"})

@app.post("/api/notify-apply")
async def notify_apply(email: str = Body(..., embed=True), bot_id: str = Body(..., embed=True), job_data: dict = Body(..., embed=True)):
    """Bots call this to report a successful application in real-time."""
    logger.info(f"[SYNC] {email} applied via {bot_id}: {job_data.get('Job Title')}")
    
    # Update status in MongoDB
    try:
        data_id = "applied" # Default set
        job_data["Status"] = "Success"
        job_data["Scraped At"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        await MongoDB.save_application(email, bot_id, job_data)
        return {"status": "synced"}
    except Exception as e:
        logger.error(f"Sync error: {e}")
        return {"status": "error", "detail": str(e)}

# ----------------------------------------------------------------
# ROUTES: DATA
# ----------------------------------------------------------------
@app.get("/api/data/{data_id}")
async def get_data(data_id: str, email: str):
    user_storage = get_user_storage(email)
    path = user_storage / "data" / f"{data_id}_applied.xlsx"

    if not path.exists():
        return {"data": []}

    try:
        data = await MongoDB.get_applications(email, data_id)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error loading {data_id} data for {email}: {e}")
        return {"data": []}

@app.delete("/api/data/{data_id}")
async def delete_data(data_id: str, email: str):
    user_storage = get_user_storage(email)
    path = user_storage / "data" / f"{data_id}_applied.xlsx"

    if not path.exists():
        return {"status": "not_found"}

    try:
        os.remove(path)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Error deleting {data_id} data for {email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------------------
# ROUTES: SETTINGS
# ----------------------------------------------------------------
@app.get("/api/settings")
async def get_settings(email: str):
    return await load_user_settings(email)

@app.post("/api/settings")
async def update_settings(email: str = Body(..., embed=True), data: dict = Body(..., embed=True)):
    await save_user_settings(email, data)
    return {"status": "saved"}

# Initialize processor once
resume_processor = ResumeProcessor()

# ----------------------------------------------------------------
# ROUTES: RESUME UPLOAD
# ----------------------------------------------------------------
@app.post("/api/upload-resume")
async def upload_resume(email: str = Form(...), file: UploadFile = File(...)):
    try:
        user_storage = get_user_storage(email)
        # Standardize filename to latest_resume.pdf for easier bot access
        file_path = user_storage / "resumes" / "latest_resume.pdf"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract keywords for the user to see immediately
        text = resume_processor.extract_text(str(file_path))
        keywords = resume_processor.extract_keywords(text)
        
        logger.info(f"[PROCESSOR] Extracted {len(keywords)} keywords for {email}")
        
        return {
            "filename": file.filename,
            "keywords": keywords,
            "status": "success"
        }
    except Exception as e:
        import traceback
        logger.error(f"Error processing resume for {email}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------------------------------------------
# ROUTES: PAYMENTS & IDENTITY
# ----------------------------------------------------------------
@app.get("/api/config")
async def get_config():
    return {
        "razorpay_key": RAZORPAY_KEY_ID
    }

@app.post("/api/register")
async def register_user(identity: UserIdentity):
    try:
        email = identity.email.lower().strip()
        
        existing_user = await MongoDB.get_user(email)
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists. Please login.")
        
        if not identity.password:
            raise HTTPException(status_code=400, detail="Password is required")
            
        hashed_password = get_password_hash(identity.password)
        user = await MongoDB.create_user(email, hashed_password)
        if not user:
             raise HTTPException(status_code=500, detail="Database error during registration")
        
        # Return user profile for auto-login
        usage_doc = await MongoDB.get_usage(email)
        counts = usage_doc.get("counts", {}) if usage_doc else {}
        
        return {
            "status": "registered", 
            "email": email,
            "subscription": user.get("subscription_level", "free") if user else "free",
            "expiry": user.get("subscription_expiry") if user else None,
            "counts": counts
        }
    except Exception as e:
        print(f"[AUTH] Registration error for {email}: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
 
@app.post("/api/auth/google")
async def google_login(req: GoogleAuthRequest):
    try:
        # Verify Token
        idinfo = id_token.verify_oauth2_token(req.token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email'].lower().strip()
        user = await MongoDB.get_user(email)
        
        if not user:
            # Auto-register google users
            user = await MongoDB.create_user(email, source="google")
            
        sub_level = "lifetime" if email in ADMIN_EMAILS else user.get("subscription_level", "free")
        usage_doc = await MongoDB.get_usage(email)
        counts = usage_doc.get("counts", {}) if usage_doc else {}
        
        return {
            "email": email,
            "subscription": sub_level,
            "expiry": user.get("subscription_expiry"),
            "counts": counts
        }
    except Exception as e:
        print(f"[AUTH] Google Login error: {e}")
        raise HTTPException(status_code=401, detail=f"Google Auth Failed: {str(e)}")

@app.post("/api/auth/github")
async def github_login(req: GithubAuthRequest):
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for access token
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            params={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": req.code
            },
            headers={"Accept": "application/json"}
        )
        data = resp.json()
        token = data.get("access_token")
        if not token:
            raise HTTPException(status_code=400, detail="Failed to get GitHub access token")

        # 2. Get user info
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {token}"}
        )
        user_data = user_resp.json()
        
        # 3. Get generic email if private
        email = user_data.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {token}"}
            )
            for entry in emails_resp.json():
                if entry["primary"] and entry["verified"]:
                    email = entry["email"]
                    break
        
        if not email:
            raise HTTPException(status_code=400, detail="Failed to retrieve GitHub email")

        email = email.lower().strip()
        user = await MongoDB.get_user(email)
        if not user:
            user = await MongoDB.create_user(email, source="github")

        sub_level = "lifetime" if email in ADMIN_EMAILS else user.get("subscription_level", "free")
        usage_doc = await MongoDB.get_usage(email)
        counts = usage_doc.get("counts", {}) if usage_doc else {}

        return {
            "email": email,
            "subscription": sub_level,
            "expiry": user.get("subscription_expiry"),
            "counts": counts
        }

@app.post("/api/identify")
async def identify_user(identity: UserIdentity):
    email = identity.email.lower().strip()
    user = await MongoDB.get_user(email)
    
    # Special case for Admin
    if email in ADMIN_EMAILS:
        if not identity.password or identity.password != ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail="Incorrect Admin Password")
        if not user:
            user = await MongoDB.create_user(email, source="local") # Admins usually local
            await MongoDB.update_subscription(email, "lifetime")
            user = await MongoDB.get_user(email)
    else:
        # Standard user login
        if not user:
            raise HTTPException(status_code=401, detail="User not found. Please click the 'CREATE ACCOUNT' tab to register.")
        
        # Check for password_hash
        db_password = user.get("password_hash")
        if not db_password:
            # Handle social login users trying to use password
            raise HTTPException(status_code=400, detail="This account uses Social Login (Google/GitHub). Please use the appropriate button.")
            
        if not identity.password:
            raise HTTPException(status_code=401, detail="Security Password required.")
             
        if not verify_password(identity.password, db_password):
            raise HTTPException(status_code=401, detail="Incorrect Security Password")
    
    usage_doc = await MongoDB.get_usage(email)
    counts = usage_doc.get("counts", {}) if usage_doc else {}
    sub_level = "lifetime" if email in ADMIN_EMAILS else user.get("subscription_level", "free")
    
    # Ensure logs storage exists
    if email not in logs_storage:
        logs_storage[email] = {"internshala": [], "naukri": [], "indeed": [], "company_crawler": []}
    
    return {
        "email": user["email"],
        "subscription": sub_level,
        "expiry": user.get("subscription_expiry"),
        "counts": counts
    }

@app.post("/api/forgot-password")
async def forgot_password(req: UserIdentity):
    email = req.email.lower().strip()
    user = await MongoDB.get_user(email)
    if not user:
        # Don't reveal if user exists for security
        return {"status": "success", "message": "If this email is registered, a reset link will be sent."}
    
    logger.info(f"[AUTH] Password reset requested for {email}")
    # Simulate email dispatch
    return {"status": "success", "message": "A security reset link has been dispatched to your vault email."}

@app.post("/api/browser/action")
async def browser_action(req: BrowserActionRequest):
    try:
        email = req.email.lower().strip()
        user_storage = get_user_storage(email)
        cmd_path = user_storage / "commands.json"
        
        # Load existing or start new
        cmds = []
        if cmd_path.exists():
            with open(cmd_path, "r") as f:
                try: cmds = json.load(f)
                except: pass
        
        cmds.append({
            "type": req.type,
            "x": req.x,
            "y": req.y,
            "url": req.url,
            "text": req.text,
            "delta_y": req.delta_y,
            "timestamp": datetime.now().isoformat()
        })
        
        with open(cmd_path, "w") as f:
            json.dump(cmds, f)
            
        logger.info(f"[BROWSER] Action {req.type} enqueued for {email}")
        return {"status": "success", "action": req.type}
    except Exception as e:
        logger.error(f"[BROWSER] Action error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-order")
async def create_order(req: CreateOrderRequest):
    amounts = {
        "monthly": 100,  # ₹1
        "yearly": 39900,  # ₹399
        "lifetime": 79900  # ₹799
    }
    
    if req.plan not in amounts:
        raise HTTPException(status_code=400, detail="Invalid plan")
        
    try:
        order_data = {
            "amount": amounts[req.plan],
            "currency": "INR",
            "receipt": f"receipt_{req.email}_{int(time.time())}",
            "payment_capture": 1
        }
        logger.info(f"[PAYMENT] Creating order for {req.email}, plan: {req.plan}, amount: {order_data['amount']}")
        order = client.order.create(data=order_data)
        logger.info(f"[PAYMENT] Order created: {order.get('id')}")
        return order
    except Exception as e:
        logger.error(f"[PAYMENT] Razorpay Order Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

# Cache for Plan IDs
PLAN_IDS = {}

@app.post("/api/create-subscription")
async def create_subscription(req: CreateSubscriptionRequest):
    if req.plan != "monthly":
        # Only monthly supports trial/autopay for now as per user request
        raise HTTPException(status_code=400, detail="Only monthly plan supports trial")
        
    try:
        # 1. Ensure Plan exists (₹29 Monthly)
        if "monthly" not in PLAN_IDS:
            plan_data = {
                "period": "monthly",
                "interval": 1,
                "item": {
                    "name": "JobAgent AI Pro - Monthly",
                    "amount": 2900, # ₹29 recurring
                    "currency": "INR",
                    "description": "Monthly subscription after 2-day trial"
                }
            }
            plan = client.plan.create(data=plan_data)
            PLAN_IDS["monthly"] = plan["id"]
        
        # 2. Create Subscription with 2-day Trial and ₹1 upfront charge
        trial_end_timestamp = int(time.time()) + 172800 # 48 hours
        
        sub_data = {
            "plan_id": PLAN_IDS["monthly"],
            "total_count": 12, # 1 year total cycles
            "quantity": 1,
            "customer_notify": 1,
            "start_at": trial_end_timestamp,
            "addons": [
                {
                    "item": {
                        "name": "2-Day Trial Access",
                        "amount": 100, # ₹1 in paise
                        "currency": "INR"
                    }
                }
            ],
            "notes": {
                "email": req.email,
                "trial": "2_days"
            }
        }
        
        logger.info(f"[PAYMENT] Creating subscription for {req.email}, trial end: {trial_end_timestamp}")
        subscription = client.subscription.create(data=sub_data)
        logger.info(f"[PAYMENT] Subscription created: {subscription.get('id')}")
        return subscription
    except Exception as e:
        logger.error(f"[PAYMENT] Razorpay Subscription Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")

@app.post("/api/verify-payment")
async def verify_payment(payment: PaymentVerification):
    try:
        # Prepare params for Razorpay utility
        params = {
            'razorpay_payment_id': payment.razorpay_payment_id,
            'razorpay_signature': payment.razorpay_signature
        }
        
        if payment.razorpay_subscription_id:
            params['razorpay_subscription_id'] = payment.razorpay_subscription_id
            logger.info(f"[PAYMENT] Verifying subscription: {payment.razorpay_subscription_id}")
            client.utility.verify_subscription_payment_signature(params)
        else:
            params['razorpay_order_id'] = payment.razorpay_order_id
            logger.info(f"[PAYMENT] Verifying order: {payment.razorpay_order_id}")
            client.utility.verify_payment_signature(params)

        logger.info(f"[PAYMENT] Signature verified successfully for {payment.email}")

        # Update User Subscription
        user = await MongoDB.get_user(payment.email)
        if not user:
            # If user somehow doesn't exist during payment, create them (shouldn't happen but safe)
            await MongoDB.create_user(payment.email, source="payment_system")
            
        expiry = None
        now = datetime.utcnow()
        if payment.plan == "monthly":
            expiry = now + timedelta(days=30)
        elif payment.plan == "yearly":
            expiry = now + timedelta(days=365)
        elif payment.plan == "lifetime":
            expiry = now + timedelta(days=36500) # ~100 years
            
        await MongoDB.update_subscription(payment.email, payment.plan, expiry)
        logger.info(f"[PAYMENT] Subscription updated to {payment.plan} for {payment.email}. Expiry: {expiry}")
        
        return {"status": "success", "subscription": payment.plan, "expiry": expiry}

    except razorpay.errors.SignatureVerificationError as e:
        logger.error(f"[PAYMENT] Signature Verification Failed for {payment.email}: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payment signature. Verification failed.")
    except Exception as e:
        logger.error(f"[PAYMENT] Internal verification error for {payment.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal verification error: {str(e)}")

@app.post("/api/admin/increment-count")
async def increment_count(req: PlatformCountRequest):
    await MongoDB.increment_usage(req.email, req.platform)
    return {"status": "updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
