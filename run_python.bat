@echo off
title Industrial Computer Vision Systems - Runner
color 0b

:menu
cls
echo =======================================================================
echo          INDUSTRIAL COMPUTER VISION SYSTEMS RUNNER (tubakhxn)
echo =======================================================================
echo.
echo   This batch utility executes the core Python perception pipelines.
echo   Make sure Python is installed and added to your system environment PATH.
echo.
echo   [1] Run Wildlife ^& Bird Population Monitoring System
echo   [2] Run Traffic Intersection Intelligence System
echo   [3] Run Flood Monitoring ^& Risk Prediction System
echo   [4] Install Required Pip Packages (ultralytics, opencv, torch, etc.)
echo   [5] Check Python Installation Status
echo   [6] Exit Runner
echo.
echo =======================================================================
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto wildlife
if "%choice%"=="2" goto traffic
if "%choice%"=="3" goto flood
if "%choice%"=="4" goto install_deps
if "%choice%"=="5" goto check_python
if "%choice%"=="6" goto exit
goto menu

:wildlife
cls
echo =======================================================================
echo   Launching Wildlife ^& Bird Population Monitoring...
echo =======================================================================
echo.
echo   Input Source Options:
echo   [0] Default Webcam (0)
echo   [1] Custom Video Path (enter path manually)
echo.
set /p src_choice="Select Input Source (0-1): "
if "%src_choice%"=="0" (
    set "src=0"
) else (
    set /p src="Enter complete absolute path to your video file: "
)
echo.
echo   Executing: python "BIRD POPULATION MONITORING\BIRD POPULATION MONITORING.py" %src%
echo.
python "BIRD POPULATION MONITORING\BIRD POPULATION MONITORING.py" %src%
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Failed to run Wildlife script. Verify python ^& dependencies.
)
pause
goto menu

:traffic
cls
echo =======================================================================
echo   Launching Traffic Intersection Intelligence...
echo =======================================================================
echo.
echo   Input Source Options:
echo   [0] Default Webcam (0)
echo   [1] Custom Video Path (enter path manually)
echo.
set /p src_choice="Select Input Source (0-1): "
if "%src_choice%"=="0" (
    set "src=0"
) else (
    set /p src="Enter complete absolute path to your video file: "
)
echo.
echo   Executing: python "TRAFFIC INTERSECTION\TRAFFIC INTERSECTION.py" %src%
echo.
python "TRAFFIC INTERSECTION\TRAFFIC INTERSECTION.py" %src%
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Failed to run Traffic script. Verify python ^& dependencies.
)
pause
goto menu

:flood
cls
echo =======================================================================
echo   Launching Flood Monitoring ^& Risk Prediction...
echo =======================================================================
echo.
echo   Input Source Options:
echo   [0] Default Webcam (0)
echo   [1] Custom Video Path (enter path manually)
echo.
set /p src_choice="Select Input Source (0-1): "
if "%src_choice%"=="0" (
    set "src=0"
) else (
    set /p src="Enter complete absolute path to your video file: "
)
echo.
echo   Executing: python "Flood ^& risk check\FLOOD MONITORING.py" %src%
echo.
python "Flood ^& risk check\FLOOD MONITORING.py" %src%
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Failed to run Flood script. Verify python ^& dependencies.
)
pause
goto menu

:install_deps
cls
echo =======================================================================
echo   Installing pip packages...
echo =======================================================================
echo.
echo   This will attempt to run:
echo   pip install ultralytics opencv-python numpy torch torchvision scipy pillow supervision tqdm
echo.
pip install ultralytics opencv-python numpy torch torchvision scipy pillow supervision tqdm
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Failed to run pip installation. Make sure Python is in your PATH.
) else (
    echo.
    echo   [SUCCESS] Packages installed successfully!
)
pause
goto menu

:check_python
cls
echo =======================================================================
echo   Checking Python installation on system...
echo =======================================================================
echo.
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo   [WARNING] Python was not found in your environment PATH.
    echo   Please install Python (3.8-3.11 recommended) from https://www.python.org/
    echo   and ensure you check "Add Python to PATH" during installation.
) else (
    echo   [SUCCESS] Python was found at:
    where python
    echo.
    echo   Python Version Info:
    python --version
    echo.
    echo   Pip Version Info:
    pip --version
)
pause
goto menu

:exit
cls
echo.
echo   Exiting runner. Thank you!
echo.
exit /b
