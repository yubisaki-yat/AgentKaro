import sys, os
sys.path.insert(0, os.path.dirname(__file__))

print("[DEBUG] UI Runner script started.")
# Read config from env vars injected by UI
roles_env = os.environ.get("BOT_ROLES", "")
max_applies = int(os.environ.get("BOT_MAX_APPLIES", "10"))
roles = [r.strip() for r in roles_env.split(",") if r.strip()] if roles_env else None

print(f"[DEBUG] Roles: {roles}, Max Applies: {max_applies}")

from internshala_bot import InternshalaAutoApplyBot
print("[DEBUG] InternshalaAutoApplyBot class imported.")
try:
    bot = InternshalaAutoApplyBot(roles=roles, max_applies_per_role=max_applies)
    print("[DEBUG] Bot instance created successfully.")
    bot.start()
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to initialize/start bot: {e}")
    sys.exit(1)
