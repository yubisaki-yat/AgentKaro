"""
bot_runner.py - Subprocess wrapper for Internshala & Naukri bots.
Manages launch, live log streaming, and graceful termination.
"""
import subprocess
import threading
import queue
import os
import sys
from datetime import datetime
from typing import Optional, List, Dict


class BotRunner:
    def __init__(self, name: str):
        self.name = name
        self.process: Optional[subprocess.Popen] = None
        self.log_queue: queue.Queue = queue.Queue()
        self._reader_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.start_time: Optional[datetime] = None
        self.exit_code: Optional[int] = None
        self.owner_email: Optional[str] = None

    def _enqueue_output(self, stream):
        """Read stream line-by-line and push to queue."""
        try:
            while True:
                line = stream.readline()
                if not line:
                    break
                self.log_queue.put(line.rstrip("\n"))
        except Exception:
            pass
        finally:
            try:
                stream.close()
            except:
                pass

    def start(self, script_content: str, env_overrides: Dict[str, str] = None):
        """Launch bot by piping script content directly to Python via stdin."""
        if self.is_running:
            self.log_queue.put(f"[WARN] {self.name} is already running!")
            return False

        env = os.environ.copy()
        if env_overrides:
            env.update(env_overrides)

        python_exe = sys.executable

        self.log_queue.put(f"[LAUNCH] Starting {self.name} at {datetime.now().strftime('%H:%M:%S')}...")

        try:
            # Pass script content via stdin - no temp file is written to disk
            self.process = subprocess.Popen(
                [python_exe, "-u", "-"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env=env,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            # Send the script and close stdin so the process starts executing
            self.process.stdin.write(script_content)
            self.process.stdin.close()

            self.is_running = True
            self.log_queue.put(f"[DEBUG] PID: {self.process.pid} - Process successfully spawned.")
            self.start_time = datetime.now()
            self.exit_code = None

            # Start background thread to read logs
            self._reader_thread = threading.Thread(
                target=self._enqueue_output,
                args=(self.process.stdout,),
                daemon=True
            )
            self._reader_thread.start()

            # Monitor thread to detect when process ends
            monitor = threading.Thread(target=self._monitor, daemon=True)
            monitor.start()

            return True
        except Exception as e:
            self.log_queue.put(f"[ERROR] Failed to start {self.name}: {e}")
            self.is_running = False
            return False

    def _monitor(self):
        """Wait for process to finish and update state."""
        if self.process:
            self.exit_code = self.process.wait()
            self.is_running = False
            if self.exit_code == 0:
                self.log_queue.put(f"[DONE] {self.name} finished successfully.")
            else:
                self.log_queue.put(f"[EXIT] {self.name} exited with code {self.exit_code}.")

    def stop(self):
        """Terminate the bot subprocess."""
        if self.process and self.is_running:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
            self.is_running = False
            self.log_queue.put(f"[STOP] {self.name} was stopped by user.")
        else:
            self.log_queue.put(f"[INFO] {self.name} is not currently running.")

    def get_new_logs(self, max_lines: int = 200) -> List[str]:
        """Drain the log queue and return new lines."""
        lines = []
        try:
            while not self.log_queue.empty() and len(lines) < max_lines:
                lines.append(self.log_queue.get_nowait())
        except queue.Empty:
            pass
        return lines

    def elapsed(self) -> str:
        if not self.start_time:
            return "--:--:--"
        delta = datetime.now() - self.start_time
        mins, secs = divmod(int(delta.total_seconds()), 60)
        hrs, mins = divmod(mins, 60)
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"


# ---- SHARED PREAMBLE ----
PREAMBLE = """
import sys, os, requests
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True, encoding='utf-8')

user_email = os.environ.get("USER_EMAIL", "")
backend_url = "http://localhost:8000/api/admin/increment-count"

def report_success(platform):
    if user_email:
        try:
            requests.post(backend_url, json={"email": user_email, "platform": platform})
        except:
            pass

engines_dir = os.environ.get("BOT_ENGINES_DIR", "")
if engines_dir:
    sys.path.insert(0, engines_dir)
"""

# ---- INTERNSHALA WRAPPER SCRIPT ----
INTERNSHALA_RUNNER_SCRIPT = PREAMBLE + """
print("[DEBUG] UI Runner script started.", flush=True)
roles_env = os.environ.get("BOT_ROLES", "")
max_applies = int(os.environ.get("BOT_MAX_APPLIES", "10"))
roles = [r.strip() for r in roles_env.split(",") if r.strip()] if roles_env else None

print(f"[DEBUG] Roles: {roles}, Max Applies: {max_applies}", flush=True)

from internshala_bot import InternshalaAutoApplyBot
print("[DEBUG] InternshalaAutoApplyBot class imported.", flush=True)
try:
    bot = InternshalaAutoApplyBot(roles=roles, max_applies_per_role=max_applies)
    print("[DEBUG] Bot instance created successfully.", flush=True)
    bot.start()
    report_success("internshala")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to initialize/start Internshala bot: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
"""

# ---- NAUKRI WRAPPER SCRIPT ----
NAUKRI_RUNNER_SCRIPT = PREAMBLE + """
print("[DEBUG] Naukri UI Runner script started.", flush=True)
keywords_env = os.environ.get("NAUKRI_KEYWORDS", "Software Engineer")
location = os.environ.get("NAUKRI_LOCATION", "")
max_pages = int(os.environ.get("NAUKRI_MAX_PAGES", "10"))

keywords = [k.strip() for k in keywords_env.split(",") if k.strip()] if keywords_env else ["Software Engineer"]

print(f"[DEBUG] Keywords: {keywords}, Location: {location}, Pages: {max_pages}", flush=True)

from naukri_bot import NaukriAutoApplyBot
print("[DEBUG] NaukriAutoApplyBot class imported.", flush=True)
try:
    bot = NaukriAutoApplyBot(keywords=keywords, location=location, max_pages=max_pages)
    print("[DEBUG] Bot instance created successfully.", flush=True)
    bot.scrape()
    report_success("naukri")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to initialize/start Naukri bot: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
"""

# ---- INDEED WRAPPER SCRIPT ----
INDEED_RUNNER_SCRIPT = PREAMBLE + """
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
    report_success("indeed")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to initialize/start Indeed bot: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
"""

# ---- COMPANY CRAWLER WRAPPER SCRIPT ----
COMPANY_RUNNER_SCRIPT = PREAMBLE + """
print("[DEBUG] Company Crawler UI Runner script started.", flush=True)
company_url = os.environ.get("COMPANY_URL", "")
keywords_env = os.environ.get("NAUKRI_KEYWORDS", "Software Engineer")
keywords = [k.strip() for k in keywords_env.split(",") if k.strip()] if keywords_env else ["Software Engineer"]

if not company_url:
    print("[ERROR] No Company URL provided.", flush=True)
    sys.exit(1)

print(f"[DEBUG] Target: {company_url}, Keywords: {keywords}", flush=True)

from company_crawler_bot import CompanyCrawlerBot
print("[DEBUG] CompanyCrawlerBot class imported.", flush=True)
try:
    bot = CompanyCrawlerBot(company_url=company_url, keywords=keywords)
    print("[DEBUG] Bot instance created successfully.", flush=True)
    bot.run()
    report_success("company_crawler")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to initialize/start crawler: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
"""
