import os
import time
import random
import threading
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
        self.user_email = os.environ.get("USER_EMAIL", "default")
        self.bot_id = "indeed"
        self.screenshot_path = os.path.join(os.path.dirname(__file__), '..', 'storage', 'users', self.user_email, f'live_{self.bot_id}.jpg')
        os.makedirs(os.path.dirname(self.screenshot_path), exist_ok=True)
        self.driver = self._setup_driver()
        
        self.running = True
        self.screenshot_thread = threading.Thread(target=self._screenshot_loop, daemon=True)
        self.screenshot_thread.start()
        
        print(f"   [SUCCESS] Indeed Bot Initialized (User: {self.email})")

    def _setup_driver(self):
        import sys
        print("[INIT] Launching Chrome for Indeed...")
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
            
            profile_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'storage', 'indeed_profile')
            os.makedirs(profile_path, exist_ok=True)
            opts.add_argument(f"--user-data-dir={profile_path}")
            return opts

        def get_chrome_main_version():
            """Returns the major version of Chrome installed on Windows."""
            if os.name != 'nt': return None
            try:
                import subprocess
                cmd = '(Get-Item (Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe")."(default)").VersionInfo.ProductVersion'
                res = subprocess.check_output(['powershell', '-Command', cmd], text=True).strip()
                if res and '.' in res:
                    major = res.split('.')[0]
                    print(f"   [INIT] Detected Chrome version: {res} (Major: {major})")
                    return int(major)
            except:
                pass
            return None

        try:
            detected_version = get_chrome_main_version()
            print(f"   [DEBUG] Attempting Undetected Chrome (UC)... (Version: {detected_version or 'Auto'})")
            return uc.Chrome(options=get_options(), version_main=detected_version)
        except Exception as e:
            print(f"   [WARN] UC initial attempt failed: {str(e)[:100]}. Retrying...")
            try:
                return uc.Chrome(options=get_options(), version_main=get_chrome_main_version())
            except Exception as e2:
                print(f"   [ERROR] UC failed completely: {str(e2)[:100]}. Falling back to standard Selenium...")
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
                print(f"[LIVE] Snapshot updated: {label}", flush=True)
        except: pass

    def _check_commands(self):
        """Polls for user commands from the dashboard."""
        try:
            cmd_path = os.path.join(os.path.dirname(self.screenshot_path), "commands.json")
            if os.path.exists(cmd_path):
                import json
                with open(cmd_path, "r") as f:
                    cmds = json.load(f)
                
                # Clear for next
                os.remove(cmd_path)
                
                for cmd in cmds:
                    if cmd["type"] == "click":
                        x_pct, y_pct = cmd.get("x", 0), cmd.get("y", 0)
                        width = self.driver.execute_script("return window.innerWidth;")
                        height = self.driver.execute_script("return window.innerHeight;")
                        x = int((x_pct / 100) * width)
                        y = int((y_pct / 100) * height)
                        print(f"   [INTERACT] Performing remote click at {x}, {y}")
                        from selenium.webdriver.common.action_chains import ActionChains
                        ActionChains(self.driver).move_by_offset(x, y).click().perform()
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
        except:
            pass

    def login(self):
        if not self.email or "your_indeed" in self.email:
            print("[LOGIN] No credentials found in .env. Skipping login (will scrape only).")
            return False
        
        print(f"[LOGIN] Attempting Indeed login for: {self.email}", flush=True)
        try:
            self.driver.get("https://secure.indeed.com/account/login")
            self._take_screenshot("Login Page")
            time.sleep(5)
            
            # 1. Enter Email
            email_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "ifl-InputWrapper-email"))
            )
            email_field.send_keys(self.email)
            self._take_screenshot("Enter Email")
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            time.sleep(3)
            
            # 2. Enter Password (if field exists, sometimes it redirects to OTP)
            try:
                pass_field = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.ID, "ifl-InputWrapper-password"))
                )
                pass_field.send_keys(self.password)
                self._take_screenshot("Enter Password")
                self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
                time.sleep(5)
            except:
                print("   [INFO] Password field not found. Might be requiring OTP/Challenge.", flush=True)
            
            print("[LOGIN] Login attempt finished.", flush=True)
            self._take_screenshot("Login Post-Process")
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
            self._check_commands()
            time.sleep(5)
            
            # Robust multi-selector for Indeed job cards
            selectors = [
                "//div[contains(@class, 'job_seen_beacon')]",
                "//td[contains(@class, 'resultContent')]",
                "//div[contains(@class, 'cardOutline')]",
                "//li[contains(@class, 'eu4oa1w0')]" # Common Indeed li class
            ]
            items = self.driver.find_elements(By.XPATH, " | ".join(selectors))
            print(f"[SCAN] Found {len(items)} potentials on Indeed using robust selectors.", flush=True)
            self._check_commands()
            
            for i, item in enumerate(items):
                try:
                    # Quick command check during item iteration
                    if i % 3 == 0:
                        self._check_commands()
                    # Find title safely
                    title_elems = item.find_elements(By.CSS_SELECTOR, "h2.jobTitle, a.jcs-JobTitle")
                    if not title_elems: continue
                    
                    title_elem = title_elems[0]
                    title = title_elem.get_attribute("title") or title_elem.text
                    link = title_elem.get_attribute("href")
                    
                    # Find company safely
                    comp_elems = item.find_elements(By.CSS_SELECTOR, "span[data-testid='company-name'], [class*='companyName']")
                    comp = comp_elems[0].text if comp_elems else "Unknown Company"
                    
                    # Easy Apply detection
                    item_text = item.text.lower()
                    easy_apply = "easy apply" in item_text or "apply with your indeed resume" in item_text
                    
                    print(f"   [{i+1}/{len(items)}] {title} @ {comp} {'(Easy Apply)' if easy_apply else ''}")
                    
                    if not link: continue
                    
                    self.data.append({
                        "Job Title": title,
                        "Company": comp,
                        "Link": link,
                        "Apply Type": "Easy Apply" if easy_apply else "Direct",
                        "Status": "Scraped",
                        "Scraped At": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    
                    # Save every 5 items
                    if i % 5 == 0:
                        self.save_data()
                        
                except Exception as e: 
                    print(f"      [SKIP] Item {i+1} error: {str(e)[:50]}...")
                    continue
            
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
