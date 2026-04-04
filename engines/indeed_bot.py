import os
import time
import random
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class IndeedBot:
    def __init__(self, keywords=None, location="", max_pages=3, headless=False):
        print(f"[INIT] Indeed Bot for keywords: {keywords}", flush=True)
        self.keywords = keywords or ["Software Engineer"]
        self.location = location
        self.max_pages = max_pages
        self.headless = headless
        self.output_file = os.path.join(os.path.dirname(__file__), '..', 'storage', 'indeed_jobs.xlsx')
        
        self.email = os.getenv("INDEED_EMAIL")
        self.password = os.getenv("INDEED_PASSWORD")
        
        self.data = []
        self.driver = self._setup_driver()

    def _setup_driver(self):
        print("[INIT] Launching Undetected Chrome for Indeed...", flush=True)
        options = uc.ChromeOptions()
        if self.headless: options.add_argument("--headless")
        
        profile_path = os.path.join(os.path.dirname(__file__), '..', 'storage', 'indeed_profile')
        os.makedirs(profile_path, exist_ok=True)
            
        options.add_argument(f"--user-data-dir={profile_path}")
        options.add_argument("--start-maximized")
        
        try:
            return uc.Chrome(options=options, version_main=146)
        except:
            return uc.Chrome(options=options)

    def login(self):
        if not self.email or "your_indeed" in self.email:
            print("[LOGIN] No credentials found in .env. Skipping login (will scrape only).")
            return False
        
        print(f"[LOGIN] Attempting Indeed login for: {self.email}", flush=True)
        try:
            self.driver.get("https://secure.indeed.com/account/login")
            time.sleep(5)
            
            # 1. Enter Email
            email_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "ifl-InputWrapper-email"))
            )
            email_field.send_keys(self.email)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            time.sleep(3)
            
            # 2. Enter Password (if field exists, sometimes it redirects to OTP)
            try:
                pass_field = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.ID, "ifl-InputWrapper-password"))
                )
                pass_field.send_keys(self.password)
                self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
                time.sleep(5)
            except:
                print("   [INFO] Password field not found. Might be requiring OTP/Challenge.", flush=True)
            
            print("[LOGIN] Login attempt finished.", flush=True)
            return True
        except Exception as e:
            print(f"[LOGIN ERROR] {e}", flush=True)
            return False

    def scrape(self):
        self.login()
        for keyword in self.keywords:
            print(f"\n[Indeed] Searching for: {keyword}", flush=True)
            # Use in.indeed.com as requested
            url = f"https://in.indeed.com/jobs?q={keyword.replace(' ', '+')}&l={self.location.replace(' ', '+')}"
            self.driver.get(url)
            time.sleep(5)
            
            items = self.driver.find_elements(By.CSS_SELECTOR, "div.job_seen_beacon")
            print(f"[SCAN] Found {len(items)} potentials on Indeed.", flush=True)
            
            for i, item in enumerate(items):
                try:
                    title_elem = item.find_element(By.CSS_SELECTOR, "h2.jobTitle span")
                    title = title_elem.get_attribute("title") or title_elem.text
                    comp = item.find_element(By.CSS_SELECTOR, "span[data-testid='company-name']").text
                    link_elem = item.find_element(By.CSS_SELECTOR, "a.jcs-JobTitle")
                    link = link_elem.get_attribute("href")
                    
                    # Easy Apply detection
                    easy_apply = False
                    try:
                        if "Easy Apply" in item.text:
                            easy_apply = True
                    except: pass
                    
                    print(f"   [{i+1}] {title} @ {comp} {'(Easy Apply)' if easy_apply else ''}")
                    
                    self.data.append({
                        "Job Title": title,
                        "Company": comp,
                        "Link": link,
                        "Apply Type": "Easy Apply" if easy_apply else "Direct",
                        "Status": "Scraped",
                        "Scraped At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                except: continue
            
            self.save_data()
            
        self.driver.quit()
        print("[DONE] Indeed session finished.")

    def save_data(self):
        if not self.data: return
        df = pd.DataFrame(self.data)
        if os.path.exists(self.output_file):
            try:
                old = pd.read_excel(self.output_file)
                df = pd.concat([old, df], ignore_index=True).drop_duplicates(subset=["Link"])
            except: pass
        df.to_excel(self.output_file, index=False)

if __name__ == "__main__":
    bot = IndeedBot(max_pages=1)
    bot.scrape()
