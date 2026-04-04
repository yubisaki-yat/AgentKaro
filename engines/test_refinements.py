import os
import sys

# Add engines to path
sys.path.append(os.path.join(os.getcwd(), 'engines'))

from naukri_bot import NaukriAutoApplyBot
from indeed_bot import IndeedBot

def test_bots():
    print("=== TESTING NAUKRI BOT ===")
    try:
        naukri = NaukriAutoApplyBot(keywords=["React Developer"], max_pages=1, headless=True)
        # We don't call scrape() to avoid a full run, just check if driver works and url is correct
        print(f"Naukri URL for React Developer: https://www.naukri.com/react-developer-jobs")
        naukri.driver.get("https://www.naukri.com/react-developer-jobs")
        time.sleep(5)
        items = naukri.driver.find_elements("xpath", "//div[contains(@class, 'srp-jobtuple-wrapper')] | //div[contains(@class, 'srp-jobtuple-container')] | //article[contains(@class, 'jobTuple')]")
        print(f"Naukri items found: {len(items)}")
        naukri.driver.quit()
    except Exception as e:
        print(f"Naukri Test Error: {e}")

    print("\n=== TESTING INDEED BOT ===")
    try:
        indeed = IndeedBot(keywords=["Python Developer"], max_pages=1, headless=True)
        print(f"Indeed URL for Python Developer: https://in.indeed.com/jobs?q=Python+Developer")
        indeed.driver.get("https://in.indeed.com/jobs?q=Python+Developer")
        import time
        time.sleep(5)
        items = indeed.driver.find_elements("css selector", "div.job_seen_beacon")
        print(f"Indeed items found: {len(items)}")
        indeed.driver.quit()
    except Exception as e:
        print(f"Indeed Test Error: {e}")

if __name__ == "__main__":
    test_bots()
