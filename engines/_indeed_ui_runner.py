
import sys, os

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(line_buffering=True, encoding='utf-8')

    sys.path.insert(0, os.path.dirname(__file__))

    print("[DEBUG] Indeed UI Runner script started.", flush=True)
    keywords_env = os.environ.get("NAUKRI_KEYWORDS", "Software Engineer")
    location = os.environ.get("NAUKRI_LOCATION", "")
    max_pages = int(os.environ.get("NAUKRI_MAX_PAGES", "3"))

    keywords = [k.strip() for k in keywords_env.split(",") if k.strip()] if keywords_env else ["Software Engineer"]

    print(f"[DEBUG] Keywords: {keywords}, Location: {location}, Pages: {max_pages}", flush=True)

    print("[DEBUG] Importing IndeedBot...", flush=True)
    from indeed_bot import IndeedBot
    print("[DEBUG] IndeedBot class imported.", flush=True)
    try:
        bot = IndeedBot(keywords=keywords, location=location, max_pages=max_pages)
        print("[DEBUG] Bot instance created successfully.", flush=True)
        bot.scrape()
    except Exception as e:
        print(f"[CRITICAL ERROR] Failed to initialize/start Indeed bot: {e}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
