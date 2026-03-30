@echo off
echo Installing required Python packages...
pip install flask flask-cors opencv-python numpy werkzeug

echo.
echo Starting StructAI Backend Server...
cd backend
python app.py
pause
