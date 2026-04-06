import os
import time
import random
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class CompanyCrawlerBot:
    def __init__(self, company_url="", keywords=None, headless=False):
        print(f"[INIT] Company Crawler for: {company_url}")
        self.url = company_url
        self.keywords = keywords or ["Software Engineer", "React"]
        self.headless = headless
        
        # SMTP Credentials for Outreach
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.resume_path = os.getenv("RESUME_PATH") # User should set this or we find latest in storage/resumes

    def _setup_driver(self):
        import sys
        print("[INIT] Launching Browser for Company Crawler...")
        is_linux = sys.platform.startswith('linux')
        force_headless = self.headless or is_linux
        
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
            
            profile_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'storage', 'crawler_profile')
            os.makedirs(profile_path, exist_ok=True)
            opts.add_argument(f"--user-data-dir={profile_path}")
            return opts

        try:
            print("   [DEBUG] Attempting Undetected Chrome (UC)...")
            return uc.Chrome(options=get_options())
        except Exception as e:
            print(f"   [WARN] UC failure: {str(e)[:100]}. Using standard Selenium fallback...")
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

    def find_careers_link(self, driver):
        print(f"   [CRAWL] Searching for careers links on {self.url}...")
        driver.get(self.url)
        time.sleep(5)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        links = soup.find_all('a', href=True)
        
        career_keywords = ['career', 'job', 'work', 'join', 'opportunity', 'opening']
        for link in links:
            href = link.get('href').lower()
            text = link.text.lower()
            if any(k in href or k in text for k in career_keywords):
                target = link.get('href')
                if not target.startswith('http'):
                    # relative path handle
                    from urllib.parse import urljoin
                    target = urljoin(self.url, target)
                print(f"   [FOUND] Potential careers page: {target}")
                return target
        return None

    def scrape_contacts(self, driver):
        print("   [SCAN] Looking for HR/Contact information...")
        page_source = driver.page_source
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', page_source)
        # Filter for typical HR emails
        hr_emails = [e for e in emails if any(k in e.lower() for k in ['hr', 'career', 'job', 'recruit', 'hiring'])]
        return list(set(hr_emails)) if hr_emails else list(set(emails))[:2]

    def run(self):
        driver = self._setup_driver()
        try:
            careers_url = self.find_careers_link(driver)
            target_url = careers_url if careers_url else self.url
            driver.get(target_url)
            time.sleep(5)
            
            emails = self.scrape_contacts(driver)
            if emails:
                print(f"   [OUTREACH] Found potential contacts: {emails}")
                if self.smtp_email and self.smtp_password:
                    for email in emails[:1]: # Send to the first/most relevant one
                        success = self.send_email(email)
                        if success:
                            print(f"   [SUCCESS] Application email sent to {email}")
                        else:
                            print(f"   [ERROR] Failed to send email to {email}")
                else:
                    print("   [INFO] SMTP credentials not set. Skipping email outreach.")
            else:
                print("   [WARN] No contact emails found on the page.")
        finally:
            driver.quit()
            print("[DONE] Company Crawler session finished.")

    def send_email(self, to_email):
        if not self.smtp_email or not self.smtp_password:
            return False
            
        print(f"   [MAIL] Preparing outreach to {to_email}...")
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_email
            msg['To'] = to_email
            msg['Subject'] = f"Inquiry regarding Job Openings - {self.keywords[0]}"
            
            body = f"Hello,\n\nI am writing to express my interest in potential job opportunities at your company, specifically related to {', '.join(self.keywords)}. Attached is my resume for your review.\n\nBest regards,\nAutomated Application System"
            msg.attach(MIMEText(body, 'plain'))
            
            if self.resume_path and os.path.exists(self.resume_path):
                with open(self.resume_path, "rb") as f:
                    attach = MIMEApplication(f.read(), _subtype="pdf")
                    attach.add_header('Content-Disposition', 'attachment', filename=os.path.basename(self.resume_path))
                    msg.attach(attach)
            
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(self.smtp_email, self.smtp_password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"   [MAIL ERROR] {e}")
            return False

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.google.com"
    bot = CompanyCrawlerBot(company_url=url)
    bot.run()
