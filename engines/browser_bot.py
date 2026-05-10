import os
import sys
import time
import json
import threading
from datetime import datetime
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import undetected_chromedriver as uc

class BrowserBot:
    def __init__(self, start_url="https://google.com"):
        self.user_email = os.environ.get("USER_EMAIL", "default")
        self.bot_id = "browser"
        self.headless = os.environ.get("BOT_HEADLESS", "false").lower() == "true"
        
        user_storage = os.path.join(os.path.dirname(__file__), '..', 'storage', 'users', self.user_email)
        os.makedirs(user_storage, exist_ok=True)
        
        self.screenshot_path = os.path.join(user_storage, f'live_{self.bot_id}.jpg')
        self.cmd_path = os.path.join(user_storage, "commands.json")
        
        print(f"[INIT] BrowserBot initializing for {self.user_email}")
        self.driver = self._setup_driver()
        self.running = True
        
        if start_url:
            print(f"[INIT] Loading start URL: {start_url}")
            self.driver.get(start_url)
            
    def _setup_driver(self):
        profile_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'storage', 'users', self.user_email, 'browser_profile')
        os.makedirs(profile_path, exist_ok=True)
        
        opts = uc.ChromeOptions()
        if self.headless:
            opts.add_argument("--headless")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1920,1080")
        opts.add_argument(f"--user-data-dir={profile_path}")
        
        # Helper to get Chrome version on Windows
        def get_chrome_version():
            if os.name != 'nt': return None
            try:
                import subprocess
                cmd = '(Get-Item (Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe")."(default)").VersionInfo.ProductVersion'
                res = subprocess.check_output(['powershell', '-Command', cmd], text=True).strip()
                if res: return int(res.split('.')[0])
            except: pass
            return None

        print("[INIT] Launching UC Chrome...")
        return uc.Chrome(options=opts, version_main=get_chrome_version())

    def run(self):
        print(f"[BROWSER] Interactive session active for {self.user_email}", flush=True)
        try:
            while self.running:
                # 1. Take Screenshot
                try:
                    self.driver.save_screenshot(self.screenshot_path)
                except Exception as e:
                    print(f"[BROWSER] Screenshot failed: {e}")
                
                # 2. Check Commands
                self._check_commands()
                
                # 3. Short sleep for responsiveness
                time.sleep(0.5)
        except Exception as e:
            print(f"[BROWSER] Fatal Error: {e}", flush=True)
        finally:
            print("[BROWSER] Shutting down...")
            try: self.driver.quit()
            except: pass

    def _check_commands(self):
        if not os.path.exists(self.cmd_path):
            return
            
        try:
            with open(self.cmd_path, "r") as f:
                cmds = json.load(f)
            
            # Clear file immediately to avoid re-processing
            os.remove(self.cmd_path)
            
            for cmd in cmds:
                ctype = cmd.get("type")
                if ctype == "click":
                    x_pct, y_pct = cmd.get("x", 0), cmd.get("y", 0)
                    # Calculate actual pixels
                    width = self.driver.execute_script("return window.innerWidth;")
                    height = self.driver.execute_script("return window.innerHeight;")
                    x = int((x_pct / 100) * width)
                    y = int((y_pct / 100) * height)
                    
                    print(f"[INTERACT] Click at {x}, {y}")
                    # Use JS to click at point to be more precise in headless/virtual environments
                    self.driver.execute_script(f"document.elementFromPoint({x}, {y}).click();")
                    
                elif ctype == "type":
                    text = cmd.get("text", "")
                    print(f"[INTERACT] Typing: {text}")
                    # If it's a special key like Enter, use Keys
                    if text == "\n" or text == "Enter":
                        ActionChains(self.driver).send_keys(Keys.ENTER).perform()
                    elif text == "Backspace":
                        ActionChains(self.driver).send_keys(Keys.BACKSPACE).perform()
                    else:
                        ActionChains(self.driver).send_keys(text).perform()
                        
                elif ctype == "navigate":
                    url = cmd.get("url")
                    if url:
                        print(f"[INTERACT] Navigating to {url}")
                        self.driver.get(url)
                elif ctype == "reload":
                    print("[INTERACT] Refreshing page")
                    self.driver.refresh()
                elif ctype == "back":
                    print("[INTERACT] Going back")
                    self.driver.back()
                elif ctype == "forward":
                    print("[INTERACT] Going forward")
                    self.driver.forward()
                elif ctype == "scroll":
                    dy = cmd.get("delta_y", 0)
                    print(f"[INTERACT] Scrolling {dy}px")
                    self.driver.execute_script(f"window.scrollBy(0, {dy});")
                    
        except Exception as e:
            print(f"[BROWSER] Command Execution Error: {e}", flush=True)

if __name__ == "__main__":
    # Get start URL from env or arg
    url = os.environ.get("BROWSER_START_URL", "https://google.com")
    bot = BrowserBot(start_url=url)
    bot.run()
