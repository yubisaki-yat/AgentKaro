@echo off
echo ==============================================
echo   Job Apply Automator - Setup Script
echo ==============================================

echo [1/3] Installing Python Dependencies...
pip install -r requirements.txt

echo [2/3] Downloading NLTK Packges for AI Parsing...
python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('stopwords')"

echo [3/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ==============================================
echo Setup Complete! 
echo Run 'run.bat' or 'python run_dashboard.py' to launch the Dashboard.
echo ==============================================
pause
