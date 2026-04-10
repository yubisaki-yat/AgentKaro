import os
import sys
import re
import time
import random
import pandas as pd
import json
import threading
import requests
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import undetected_chromedriver as uc

# Load environment variables from absolute path
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(ENV_PATH)

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
        self.user_email = os.environ.get("USER_EMAIL", "default")
        self.bot_id = "internshala"
        self.screenshot_path = os.path.join(os.path.dirname(__file__), '..', 'storage', 'users', self.user_email, f'live_{self.bot_id}.jpg')
        os.makedirs(os.path.dirname(self.screenshot_path), exist_ok=True)
        self.driver = self._setup_driver()
        
        self.running = True
        self.screenshot_thread = threading.Thread(target=self._screenshot_loop, daemon=True)
        self.screenshot_thread.start()
        
        print(f"   [SUCCESS] Internshala Bot Initialized (User: {self.email})")

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
        print("[INIT] Launching Chrome...")
        is_linux = sys.platform.startswith('linux')
        force_headless = self.headless if not is_linux else True
        
        if force_headless:
            print("   [INFO] Running in HEADLESS mode.")

        # Create user-specific profile to avoid conflicts
        profile_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'storage', 'users', self.user_email, 'chrome_profile')
        os.makedirs(profile_path, exist_ok=True)

        def get_options():
            opts = uc.ChromeOptions()
            if force_headless:
                opts.add_argument("--headless")
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
            opts.add_argument("--disable-gpu")
            opts.add_argument("--window-size=1920,1080")
            opts.add_argument(f"--user-data-dir={profile_path}")
            return opts

        def get_chrome_main_version():
            """Returns the major version of Chrome installed on Windows."""
            if os.name != 'nt': return None
            try:
                import subprocess
                # Check typical paths for Chrome version on Windows
                cmd = '(Get-Item (Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe")."(default)").VersionInfo.ProductVersion'
                res = subprocess.check_output(['powershell', '-Command', cmd], text=True).strip()
                if res and '.' in res:
                    major = res.split('.')[0]
                    print(f"   [INIT] Detected Chrome version: {res} (Major: {major})")
                    return int(major)
            except:
                pass
            return None

        # Try Undetected Chromedriver with more resilience
        try:
            detected_version = get_chrome_main_version()
            print(f"   [DEBUG] Attempting UC initialization with version: {detected_version or 'Auto'}")
            
            opts = get_options()
            # Pass detected version to force UC to use correct driver
            driver = uc.Chrome(options=opts, version_main=detected_version)
            return driver
        except Exception as e:
            print(f"   [WARN] UC initial attempt failed: {str(e)[:150]}")
            try:
                # Try again without some arguments that might cause issues on Windows
                opts = uc.ChromeOptions()
                if force_headless: opts.add_argument("--headless")
                opts.add_argument("--no-sandbox")
                opts.add_argument(f"--user-data-dir={profile_path}_alt")
                return uc.Chrome(options=opts, version_main=get_chrome_main_version())
            except Exception as e2:
                print(f"   [ERROR] UC failed completely. Falling back to standard Selenium...")

    def _check_commands(self):
        """Polls for user commands from the dashboard."""
        try:
            cmd_path = os.path.join(os.path.dirname(self.screenshot_path), "commands.json")
            if os.path.exists(cmd_path):
                with open(cmd_path, "r") as f:
                        job_entry = {
                            "Job Title": title,
                            "Company": comp,
                            "Link": link,
                            "Status": status,
                            "Applied At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        self.applied_links.append(job_entry)
                        
                        # Real-time dashboard sync
                        if status == "Success":
                            self._notify_sync(job_entry)
                        
                        # Save every 5 attempts
                        if i % 3 == 0:
                            self._save_applied_links()
                
                # Clear for next
                os.remove(cmd_path)
                
                for cmd in cmds:
                    if cmd["type"] == "click":
                        x_pct, y_pct = cmd.get("x", 0), cmd.get("y", 0)
                        # Get viewport size
                        width = self.driver.execute_script("return window.innerWidth;")
                        height = self.driver.execute_script("return window.innerHeight;")
                        x = int((x_pct / 100) * width)
                        y = int((y_pct / 100) * height)
                        print(f"   [INTERACT] Performing remote click at {x}, {y}")
                        from selenium.webdriver.common.action_chains import ActionChains
                        ActionChains(self.driver).move_by_offset(x, y).click().perform()
                        # Reset for next action
                        ActionChains(self.driver).move_by_offset(-x, -y).perform()
                    elif cmd["type"] == "reload":
                        print("   [INTERACT] Remote reload requested.")
                        self.driver.refresh()
                    elif cmd["type"] == "navigate" and cmd.get("url"):
                        print(f"   [INTERACT] Navigating to: {cmd['url']}")
                        self.driver.get(cmd["url"])
                    elif cmd["type"] == "type" and cmd.get("text"):
                        print(f"   [INTERACT] Typing text: {cmd['text']}")
                        from selenium.webdriver.common.action_chains import ActionChains
                        ActionChains(self.driver).send_keys(cmd["text"]).perform()
                    elif cmd["type"] == "back":
                        print("   [INTERACT] Remote Back requested.")
                        self.driver.back()
                    elif cmd["type"] == "forward":
                        print("   [INTERACT] Remote Forward requested.")
                        self.driver.forward()
                    elif cmd["type"] == "scroll":
                        dy = cmd.get("delta_y", 0)
                        print(f"   [INTERACT] Scrolling by {dy}px")
                        self.driver.execute_script(f"window.scrollBy(0, {dy});")
                # Immediately take a screenshot after any set of commands
                self._take_screenshot("After Remote Interaction")
        except Exception as e:
            pass

    def _screenshot_loop(self):
        """Background thread for constant live-view updates."""
        while self.running:
            try:
                if hasattr(self, 'driver') and self.driver:
                    self._take_screenshot("Background Sync")
            except:
                pass
            time.sleep(1.0) # Update every second in background

    def _take_screenshot(self, context="Auto"):
        try:
            if self.driver:
                self.driver.save_screenshot(self.screenshot_path)
                print(f"[LIVE] Snapshot updated: {context}", flush=True)
        except: pass

    def _notify_sync(self, job_data):
        """Notifies the backend about a successful application in real-time."""
        try:
            api_url = "http://localhost:8000/api/notify-apply"
            payload = {
                "email": self.user_email,
                "bot_id": self.bot_id,
                "job_data": job_data
            }
            requests.post(api_url, json=payload, timeout=5)
            print(f"   [SYNC] Application synced to dashboard: {job_data.get('Job Title')}", flush=True)
        except Exception as e:
            print(f"   [SYNC ERROR] Failed to notify dashboard: {e}", flush=True)

    def login(self):
        print("[LOGIN] Attempting login...")
        try:
            self.driver.get("https://internshala.com/login/user")
            self._take_screenshot("Login Page")
            time.sleep(5)
            
            if "dashboard" in self.driver.current_url:
                print("[LOGIN] Already logged in via profile.")
                self._take_screenshot("Dashboard")
                return True
                
            wait = WebDriverWait(self.driver, 20)
            email_field = wait.until(EC.presence_of_element_located((By.ID, "email")))
            print(f"[LOGIN] Entering email: {self.email}")
            email_field.send_keys(self.email)
            
            password_field = self.driver.find_element(By.ID, "password")
            password_field.send_keys(self.password)
            
            print("[LOGIN] Clicking submit...")
            self._take_screenshot("Login Form Filled")
            self.driver.find_element(By.ID, "login_submit").click()
            time.sleep(10)
            
            if "dashboard" in self.driver.current_url or "internships" in self.driver.current_url:
                print("[LOGIN] Login Success!")
                self._take_screenshot("Logged In")
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
                            self._take_screenshot("Application Submitted")
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
            self._check_commands()
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
