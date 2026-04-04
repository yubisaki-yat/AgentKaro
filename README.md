# Job Apply Automator

An advanced, AI-powered automation dashboard that streamlines job applications for platforms like Internshala and Naukri. Built with a modern React frontend and a robust FastAPI + Selenium backend, this tool features automated scraping, intelligent resume parsing, smart proxy features, and dark/light mode UI.

## Features
- **🤖 Automated Applications**: Connects directly to Internshala and Naukri using undetected-chromedriver for bypass automation.
- **📄 AI Resume Upload**: Upload your resume (PDF/DOCX) to instantly extract your key skills using localized natural language processing (NLTK) and populate your job search automatically.
- **🌗 Stunning Dashboard**: A beautiful Vite + React + Tailwind CSS v4 dashboard featuring both Dark and Light mode.
- **📊 Live Tracking & Data Viewer**: Check your application statuses, live execution terminal logs, and export your history to Excel directly from the UI.

## Quick Start (Windows)
1. **Setup**: Run `setup.bat` to automatically install Python requirements, Node modules, and NLTK language packages.
2. **Start**: Run `run.bat` or `python run_dashboard.py` to launch both the Backend and Frontend servers simultaneously.
3. **Configure**: Open the UI at `http://localhost:5173`. Go to `Settings` to input your login credentials securely into the `.env` file.

## Manual Setup

### 1. Backend Service
```bash
# Install Python dependencies
pip install -r requirements.txt

# Download necessary NLTK corpora
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### 2. Frontend Interface
```bash
cd frontend
npm install
```

### 3. Launching
You can launch everything using the provided `run_dashboard.py` utility:
```bash
python run_dashboard.py
```
Or start them independently:
```bash
# Terminal 1: Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Security Notice
Your credentials (`.env`) and session profiles (`storage/*`) are stored completely locally on your machine.
