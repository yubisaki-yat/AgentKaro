import subprocess
import time
import sys
import os
from pathlib import Path

def kill_port(port):
    try:
        if sys.platform == "win32":
            # Find and kill process and its children
            output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
            pids = set()
            for line in output.splitlines():
                if f':{port}' in line and "LISTENING" in line:
                    pid = line.strip().split()[-1]
                    pids.add(pid)
            
            for pid in pids:
                print(f"Forcefully killing process {pid} and its children on port {port}...")
                subprocess.run(f'taskkill /F /T /PID {pid}', shell=True, capture_output=True)
    except Exception as e:
        pass

def run_dashboard():
    project_root = Path(__file__).parent
    frontend_dir = project_root / "frontend"
    
    print("Initializing Premium Job Apply Dashboard...")
    
    # Clean up ports first
    kill_port(8000)
    kill_port(5173)
    
    # 1. Start Backend (FastAPI)
    print("Launching Backend (FastAPI) on port 8000...")
    # Add root to PYTHONPATH so backend can find engines
    env = os.environ.copy()
    env["PYTHONPATH"] = str(project_root)
    
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=project_root,
        env=env
    )
    
    # Wait a bit for backend to initialize
    time.sleep(2)
    
    # 2. Start Frontend (Vite)
    print("Launching Frontend (Vite) on port 5173...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True # Necessary for npm on Windows
    )
    
    print("\nDashboard is live!")
    print("Frontend: http://127.0.0.1:5173")
    print("API: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to stop both servers.\n")
    
    try:
        while True:
            time.sleep(1)
            # Check if processes are still alive
            if backend_proc.poll() is not None:
                print("\n[CRITICAL] Backend (FastAPI) stopped unexpectedly!")
                print(f"Exit Code: {backend_proc.poll()}")
                break
            if frontend_proc.poll() is not None:
                print("\n[CRITICAL] Frontend (Vite) stopped unexpectedly!")
                print(f"Exit Code: {frontend_proc.poll()}")
                break
    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Goodbye!")

if __name__ == "__main__":
    run_dashboard()
