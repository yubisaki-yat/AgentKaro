import os
import time
import random
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import undetected_chromedriver as uc
try:
    from selenium_stealth import stealth
except ImportError:
    stealth = None

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class NaukriAutoApplyBot:
    def __init__(self, keywords=None, keyword=None, location="", max_pages=5, headless=False):
        print(f"[INIT] Naukri Bot for keywords: {keywords or keyword}", flush=True)
        if keyword and not keywords:
            self.keywords = [keyword]
        else:
            self.keywords = keywords or ["Software Engineer"]
        self.location = location
        self.max_pages = max_pages
        self.headless = headless
        self.output_file = os.path.join(os.path.dirname(__file__), '..', 'storage', 'naukri_jobs.xlsx')
        
        self.email = os.getenv("NAUKRI_EMAIL")
        self.password = os.getenv("NAUKRI_PASSWORD")
        
        self.data = []
        self.driver = self._setup_driver()

    def _setup_driver(self):
        import sys
        print("[INIT] Launching Chrome for Naukri...")
        is_linux = sys.platform.startswith('linux')
        # Only force headless on Linux (e.g., Render/Docker), allow toggle on Windows
        force_headless = self.headless if not is_linux else True
        
        if force_headless:
            print("   [INFO] Running in HEADLESS mode.")

        def get_options():
            opts = uc.ChromeOptions()
            if force_headless:
                opts.add_argument("--headless")
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
            opts.add_argument("--disable-gpu")
            opts.add_argument("--window-size=1920,1080")
            
            profile_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'storage', 'naukri_profile')
            os.makedirs(profile_path, exist_ok=True)
            opts.add_argument(f"--user-data-dir={profile_path}")
            return opts

        # Try Undetected Chromedriver
        try:
            print("   [DEBUG] Attempting Undetected Chrome (UC)...")
            return uc.Chrome(options=get_options())
        except Exception as e:
            print(f"   [WARN] UC first attempt failed: {str(e)[:100]}. Retrying...")
            try:
                return uc.Chrome(options=get_options())
            except Exception as e2:
                print(f"   [ERROR] UC failed completely: {str(e2)[:100]}. Using standard Selenium fallback...")
                from selenium import webdriver
                from selenium.webdriver.chrome.service import Service
                from webdriver_manager.chrome import ChromeDriverManager
                
                std_opts = webdriver.ChromeOptions()
                if force_headless:
                    std_opts.add_argument("--headless=new")
                std_opts.add_argument("--no-sandbox")
                std_opts.add_argument("--disable-dev-shm-usage")
                std_opts.add_argument("--disable-gpu")
                return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=std_opts)

    def login(self):
        if not self.email or not self.password:
            print("[LOGIN] No credentials found in .env (NAUKRI_EMAIL / NAUKRI_PASSWORD). Skipping login.", flush=True)
            return False
            
        print(f"[LOGIN] Logging in as: {self.email}", flush=True)
        self.driver.get("https://www.naukri.com/nlogin/login")
        time.sleep(5)
        
        try:
            wait = WebDriverWait(self.driver, 15)
            user_field = wait.until(EC.presence_of_element_located((By.ID, "usernameField")))
            user_field.clear()
            user_field.send_keys(self.email)
            pwd_field = self.driver.find_element(By.ID, "passwordField")
            pwd_field.clear()
            pwd_field.send_keys(self.password)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            time.sleep(8)
            
            # Check if we are logged in by looking for profile/avatar elements
            if "nlogin" not in self.driver.current_url:
                print("[LOGIN] ✅ Login successful!", flush=True)
                return True
            else:
                print("[LOGIN] ⚠️ Login may have failed — still on login page. Check for CAPTCHA.", flush=True)
                return False
        except Exception as e:
            print(f"[LOGIN] ❌ Error during login: {e}", flush=True)
            return False

    def apply_to_job(self, job_url):
        print(f"   [APPLY] Inspecting: {job_url}", flush=True)
        self.driver.get(job_url)
        time.sleep(5)
        
        try:
            apply_selectors = [
                (By.ID, "apply-button"),
                (By.ID, "nonLoggedApply"),
                (By.XPATH, "//button[contains(text(), 'Apply')]"),
                (By.XPATH, "//button[contains(., 'Apply')]"),
                (By.XPATH, "//span[contains(text(), 'Apply')]")
            ]
            
            applied = False
            for selector in apply_selectors:
                try:
                    btn = WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable(selector))
                    btn_text = btn.text.lower()
                    
                    if "apply on company site" in btn_text or "apply-on-company-site" in (btn.get_attribute("id") or ""):
                        print("   [INFO] External site redirect. Skipping auto-apply.", flush=True)
                        return "External/Manual"
                        
                    self.driver.execute_script("arguments[0].click();", btn)
                    applied = True
                    print("   [CLICK] Apply button clicked.", flush=True)
                    break
                except: continue
                
            if applied:
                time.sleep(5)
                # Check for success message or page change
                if "applied" in self.driver.page_source.lower():
                    print("   [SUCCESS] Applied successfully!", flush=True)
                    return "Success"
                return "Applied/Review"
            
            return "Skipped/Applied"
        except:
            return "Error"

    def scrape(self):
        logged_in = self.login()
        if not logged_in:
            print("[WARN] Proceeding without login — only public job data will be scraped.", flush=True)
        
        for keyword in self.keywords:
            print(f"\n[Naukri] Searching for keyword: {keyword}", flush=True)
            k = keyword.lower().replace(" ", "-")
            l = self.location.lower().replace(" ", "-")
            url = f"https://www.naukri.com/{k}-jobs"
            if l: url += f"-in-{l}"
            
            self.driver.get(url)
            time.sleep(8)
            
            for page in range(1, self.max_pages + 1):
                print(f"\n[PAGE {page}] Scanning results...", flush=True)
                
                for i in range(3):
                    self.driver.execute_script(f"window.scrollTo(0, {i*1200});")
                    time.sleep(2)
                    
                # Robust multi-selector approach
                selectors = [
                    "//div[contains(@class, 'srp-jobtuple-wrapper')]",
                    "//div[contains(@class, 'srp-jobtuple-container')]",
                    "//article[contains(@class, 'jobTuple')]",
                    "//div[contains(@class, 'cust-job-tuple')]",
                    "//div[@data-job-id]",
                    "//article[@data-job-id]"
                ]
                items = self.driver.find_elements(By.XPATH, " | ".join(selectors))
                print(f"[SCAN] Found {len(items)} potentials using robust selectors.", flush=True)
                
                for i, item in enumerate(items):
                    try:
                        # Find title and link safely
                        title_anchors = item.find_elements(By.XPATH, ".//a[contains(@class, 'title')]")
                        if not title_anchors:
                            continue
                            
                        title_elem = title_anchors[0]
                        title = title_elem.text
                        link = title_elem.get_attribute("href")
                        
                        # Find company safely
                        comp_elems = item.find_elements(By.XPATH, ".//a[contains(@class, 'comp-name')]")
                        comp = comp_elems[0].text if comp_elems else "Unknown Company"
                        
                        print(f"   [{i+1}/{len(items)}] Processing: {title} @ {comp}", flush=True)
                        
                        if not link:
                            continue
                            
                        status = self.apply_to_job(link)
                        
                        self.data.append({
                            "Job Title": title,
                            "Company": comp,
                            "Link": link,
                            "Status": status,
                            "Scraped At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        })
                        
                        # Save every 5 items to prevent data loss
                        if i % 5 == 0:
                            self.save_data()
                        
                        # Handle page transition logic
                        curr_url = self.driver.current_url.lower()
                        if "job-listings" in curr_url or "jobs" not in curr_url:
                            self.driver.back()
                            time.sleep(3)
                        
                        if "job-listings" in self.driver.current_url.lower():
                            print("   [RECOVERY] Stuck on job page, forcing search URL...", flush=True)
                            self.driver.get(url)
                            time.sleep(5)
                    except Exception as e: 
                        print(f"      [SKIP] Item {i+1} error: {str(e)[:100]}...", flush=True)
                        continue
                    
                try:
                    next_btn = self.driver.find_element(By.XPATH, "//a[contains(., 'Next')]")
                    self.driver.execute_script("arguments[0].click();", next_btn)
                    time.sleep(5)
                except: break
                
            self.save_data()
            
        self.driver.quit()
        print(f"\n[DONE] Naukri session finished. Total processed: {len(self.data)}", flush=True)

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
    bot = NaukriAutoApplyBot(max_pages=2)
    bot.scrape()
