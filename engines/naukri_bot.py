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
        print("[INIT] Launching Undetected Chrome for Naukri...", flush=True)
        options = uc.ChromeOptions()
        if self.headless: options.add_argument("--headless")
        
        profile_path = os.path.join(os.path.dirname(__file__), '..', 'storage', 'naukri_profile')
        if not os.path.exists(profile_path):
            os.makedirs(profile_path, exist_ok=True)
            
        options.add_argument(f"--user-data-dir={profile_path}")
        options.add_argument("--start-maximized")
        
        try:
            # Force version 146 as user's browser is currently 146
            return uc.Chrome(options=options, version_main=146)
        except Exception as e1:
            print(f"   [WARN] Naukri UC version 146 failed: {e1}. Trying auto-detect...")
            try:
                return uc.Chrome(options=options)
            except Exception as e:
                print(f"[ERROR] Final Naukri UC setup failed: {e}")
                import selenium.webdriver as webdriver
                standard_options = webdriver.ChromeOptions()
                if self.headless: standard_options.add_argument("--headless=new")
                return webdriver.Chrome(options=standard_options)

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
                
                for i in range(2):
                    self.driver.execute_script(f"window.scrollTo(0, {i*1000});")
                    time.sleep(1.5)
                    
                items = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'srp-jobtuple-wrapper')] | //div[contains(@class, 'srp-jobtuple-container')] | //article[contains(@class, 'jobTuple')]")
                print(f"[SCAN] Found {len(items)} potentials.", flush=True)
                
                for i, item in enumerate(items):
                    try:
                        title_elem = item.find_element(By.XPATH, ".//a[contains(@class, 'title')]")
                        title = title_elem.text
                        link = title_elem.get_attribute("href")
                        comp = item.find_element(By.XPATH, ".//a[contains(@class, 'comp-name')]").text
                        
                        print(f"   [{i+1}] Processing: {title} @ {comp}", flush=True)
                        
                        status = self.apply_to_job(link)
                        
                        self.data.append({
                            "Job Title": title,
                            "Company": comp,
                            "Link": link,
                            "Status": status,
                            "Scraped At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        })
                        
                        self.save_data()
                        
                        if "naukri.com/job-listings" in self.driver.current_url or "naukri.com/jobs" not in self.driver.current_url:
                            self.driver.back()
                            time.sleep(3)
                        
                        if "naukri.com/job-listings" in self.driver.current_url:
                            print("   [RECOVERY] Stuck on job page, forcing search URL...", flush=True)
                            self.driver.get(url)
                            time.sleep(5)
                    except Exception as e: 
                        print(f"      [SKIP] Item error: {e}", flush=True)
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
