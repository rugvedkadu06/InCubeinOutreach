@echo off
title InCubein - Build EXE
echo =====================================================
echo   InCubein - Build Standalone Windows EXE
echo =====================================================
echo.

:: -- 1. Build React frontend ---------------------------------------------------
echo [1/4] Building React frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm build failed. Make sure Node.js is installed.
    pause
    exit /b 1
)
cd ..
echo  Frontend build complete. Output: backend\app\static\
echo.

:: -- 2. Install PyInstaller ---------------------------------------------------
echo [2/4] Installing PyInstaller...
pip install pyinstaller --quiet
if %errorlevel% neq 0 (
    echo  ERROR: pip install failed. Make sure Python is installed.
    pause
    exit /b 1
)
echo  PyInstaller ready.
echo.

:: -- 3. Install backend dependencies -----------------------------------------
echo [3/4] Installing Python dependencies...
pip install -r backend\requirements.txt --quiet
echo  Python dependencies ready.
echo.

:: -- 4. Run PyInstaller -------------------------------------------------------
echo [4/4] Packaging into EXE with PyInstaller...
python -m PyInstaller incubein.spec --clean --noconfirm
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: PyInstaller failed. See output above.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo   BUILD COMPLETE!
echo   Output: dist\InCubein\InCubein.exe
echo.
echo   To distribute: zip and share the entire
echo   dist\InCubein\ folder.
echo.
echo   To run: dist\InCubein\InCubein.exe
echo =====================================================
echo.
pause
