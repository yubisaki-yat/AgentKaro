import sys, os
sys.path.insert(0, os.path.dirname(__file__))

print("[DEBUG] Naukri UI Runner script started.")
keywords_env = os.environ.get("NAUKRI_KEYWORDS", "Software Engineer")
location = os.environ.get("NAUKRI_LOCATION", "")
max_pages = int(os.environ.get("NAUKRI_MAX_PAGES", "10"))

keywords = [k.strip() for k in keywords_env.split(",") if k.strip()] if keywords_env else ["Software Engineer"]

print(f"[DEBUG] Keywords: {keywords}, Location: {location}, Pages: {max_pages}")

from naukri_bot import NaukriAutoApplyBot
print("[DEBUG] NaukriAutoApplyBot class imported.")
try:
    bot = NaukriAutoApplyBot(keywords=keywords, location=location, max_pages=max_pages)
    print("[DEBUG] Bot instance created successfully.")
    bot.scrape()
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to initialize/start scraper: {e}")
    sys.exit(1)
