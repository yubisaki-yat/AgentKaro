import os
import re
import time
import random
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import undetected_chromedriver as uc

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class InternshalaAutoApplyBot:
    def __init__(self, roles=None, max_applies_per_role=10, headless=False):
        print(f"[INIT] Bot initializing for roles: {roles}")
        self.roles = roles or ["Software Engineer"]
        self.max_applies_per_role = max_applies_per_role
        self.headless = headless
        self.output_file = os.path.join(os.path.dirname(__file__), '..', 'storage', 'internshala_applied_jobs.xlsx')
        self.email = os.getenv("INTERNSHALA_EMAIL")
        self.password = os.getenv("INTERNSHALA_PASSWORD")
        
        if not self.email or not self.password:
            raise ValueError("[ERROR] Missing credentials in .env")
        
        self.applied_links = self._load_applied_links()
        self.driver = self._setup_driver()

    def _load_applied_links(self):
        if os.path.exists(self.output_file):
            try:
                df = pd.read_excel(self.output_file)
                if not df.empty and "Link" in df.columns:
                    return set(df["Link"].dropna().tolist())
            except Exception as e:
                print(f"[WARN] Failed to load applied links: {e}. Starting fresh.")
        return set()

    def _setup_driver(self):
        print("[INIT] Launching Undetected Chrome...")
        options = uc.ChromeOptions()
        if self.headless: options.add_argument("--headless")
        
        # Use a consistent profile directory to avoid issues
        profile_path = os.path.join(os.path.dirname(__file__), '..', 'storage', 'intern_profile')
        if not os.path.exists(profile_path):
            os.makedirs(profile_path, exist_ok=True)
            
        options.add_argument(f"--user-data-dir={profile_path}")
        options.add_argument("--start-maximized")
        
        try:
            # Force version 146 as user's browser is currently 146
            return uc.Chrome(options=options, version_main=146)
        except Exception as e1:
            print(f"   [WARN] UC version 146 failed: {e1}. Trying auto-detect...")
            try:
                return uc.Chrome(options=options)
            except Exception as e:
                print(f"[ERROR] Final UC Driver setup failed: {e}")
                # Fallback to standard if UC fails
                import selenium.webdriver as webdriver
                options = webdriver.ChromeOptions()
                if self.headless: options.add_argument("--headless=new")
                return webdriver.Chrome(options=options)

    def login(self):
        print("[LOGIN] Attempting login...")
        try:
            self.driver.get("https://internshala.com/login/user")
            time.sleep(5)
            
            if "dashboard" in self.driver.current_url:
                print("[LOGIN] Already logged in via profile.")
                return True
                
            wait = WebDriverWait(self.driver, 20)
            email_field = wait.until(EC.presence_of_element_located((By.ID, "email")))
            print(f"[LOGIN] Entering email: {self.email}")
            email_field.send_keys(self.email)
            
            password_field = self.driver.find_element(By.ID, "password")
            password_field.send_keys(self.password)
            
            print("[LOGIN] Clicking submit...")
            self.driver.find_element(By.ID, "login_submit").click()
            time.sleep(10)
            
            if "dashboard" in self.driver.current_url or "internships" in self.driver.current_url:
                print("[LOGIN] Login Success!")
                return True
            else:
                print(f"[LOGIN] Failed. Current URL: {self.driver.current_url}")
                return False
        except Exception as e:
            print(f"[LOGIN] Critical Error during login: {e}")
            return False

    def apply_to_job(self, job_url):
        print(f"   [APPLY] Loading page: {job_url}")
        self.driver.get(job_url)
        time.sleep(5)
        
        try:
            # Robust detail scraping
            job_title = "Unknown"
            for sel in [".profile_on_detail_page", ".profile_on_detail_page_main", ".heading_container h1", "h1"]:
                try:
                    val = self.driver.find_element(By.CSS_SELECTOR, sel).text.strip()
                    if val:
                        job_title = val
                        break
                except: continue

            company = "Unknown"
            for sel in [".company_and_premium", ".company_name", ".heading_container h3", "h3"]:
                try:
                    val = self.driver.find_element(By.CSS_SELECTOR, sel).text.strip()
                    if val:
                        company = val
                        break
                except: continue
            print(f"   [INFO] Found: {job_title} @ {company}")

            # Click Apply Now
            apply_clicked = False
            for selector in [ (By.ID, "apply_now_button"), (By.XPATH, "//button[contains(text(), 'Apply now')]"), (By.CSS_SELECTOR, ".btn.btn-primary") ]:
                try:
                    btn = WebDriverWait(self.driver, 5).until(EC.element_to_be_clickable(selector))
                    if btn.is_displayed():
                        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                        time.sleep(1)
                        self.driver.execute_script("arguments[0].click();", btn)
                        apply_clicked = True
                        print("   [CLICK] 'Apply Now' successful.")
                        break
                except: continue
                
            if not apply_clicked:
                print("   [SKIP] Button not found or already applied.")
                return None, None

            time.sleep(4)
            # Fill form
            try:
                textareas = self.driver.find_elements(By.TAG_NAME, "textarea")
                for ta in textareas:
                    if ta.is_displayed() and not ta.get_attribute("value"):
                        ta.send_keys("I have the relevant skills for this role. I am highly motivated and can start immediately.")
            except: pass

            # Final Submit
            submit_clicked = False
            for selector in [ (By.ID, "submit"), (By.XPATH, "//button[contains(text(), 'Submit')]") ]:
                try:
                    btns = self.driver.find_elements(*selector)
                    for btn in btns:
                        if btn.is_displayed():
                            self.driver.execute_script("arguments[0].click();", btn)
                            submit_clicked = True
                            print("   [SUCCESS] Applied!")
                            break
                    if submit_clicked: break
                except: continue

            if submit_clicked:
                time.sleep(5)
                return job_title, company
            return None, None
        except Exception as e:
            print(f"   [ERROR] Failed: {str(e)[:50]}")
            return None, None

    def save_app(self, title, company, link, status):
        new_row = {"Job Title": title, "Company": company, "Link": link, "Status": status, "Applied At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        df = pd.DataFrame([new_row])
        if os.path.exists(self.output_file):
            try:
                old = pd.read_excel(self.output_file)
                df = pd.concat([old, df], ignore_index=True).drop_duplicates(subset=["Link"])
            except: pass
        df.to_excel(self.output_file, index=False)

    def start(self):
        if not self.login(): return

        for role in self.roles:
            print(f"\n[SEARCH] Using search bar for role: {role}")
            # Step 1: Go to search page
            self.driver.get("https://internshala.com/internships/")
            time.sleep(6)
            
            try:
                # Step 2: Clear and type in Profile filter
                # Usually: #filter_profile_input or similar
                profile_input = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input.select2-search__field, #filter_profile"))
                )
                print(f"[SEARCH] Typing role '{role}' into filter...")
                profile_input.clear()
                profile_input.send_keys(role)
                time.sleep(2)
                profile_input.send_keys(Keys.ENTER)
                time.sleep(6) # Wait for page refresh
                print("[SEARCH] Search submitted.")
            except Exception as e:
                print(f"[SEARCH] Native search failed, trying direct URL as fallback: {e}")
                role_slug = role.lower().replace(' ', '-')
                self.driver.get(f"https://internshala.com/internships/{role_slug}-internships/")
                time.sleep(8)

            # Step 3: Harvest Links
            detail_links = []
            try:
                all_links = self.driver.find_elements(By.TAG_NAME, "a")
                for a in all_links:
                    href = a.get_attribute("href")
                    if href and ("/internship/detail/" in href or "/job/detail/" in href):
                        if href not in self.applied_links and href not in detail_links:
                            detail_links.append(href)
            except: pass
            
            print(f"[SCAN] Found {len(detail_links)} candidate links.")
            
            # Step 4: Apply
            count = 0
            for link in detail_links:
                if count >= self.max_applies_per_role: break
                res_title, res_comp = self.apply_to_job(link)
                if res_title:
                    self.save_app(res_title, res_comp, link, "Success")
                    self.applied_links.add(link)
                    count += 1
                else:
                    self.save_app("Failed", "Failed", link, "Error")
                                                
        self.driver.quit()
        print("\n[DONE] Bot session finished.")

if __name__ == "__main__":
    bot = InternshalaAutoApplyBot(max_applies_per_role=5)
    bot.start()
