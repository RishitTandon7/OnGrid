@echo off
REM OnGrid Setup Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         OnGrid Attendance System - Setup Script (Windows)      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo OK Node.js %NODE_VERSION%
echo OK npm %NPM_VERSION%
echo.

REM Create .env.local
if not exist .env.local (
    echo Creating .env.local...
    copy .env.example .env.local
    
    for /f "tokens=*" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set SECRET=%%i
    
    powershell -Command "(Get-Content .env.local) -replace 'NEXTAUTH_SECRET=\"your-nextauth-secret-here\"', 'NEXTAUTH_SECRET=\"%SECRET%\"' | Set-Content .env.local"
    
    echo OK .env.local created with generated NEXTAUTH_SECRET
    echo WARNING Please update DATABASE_URL in .env.local before proceeding
    echo.
    pause
) else (
    echo OK .env.local already exists
)

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)

echo.
echo OK Dependencies installed
echo.
echo Choose an option:
echo 1) Run migrations (recommended for fresh setup)
echo 2) Skip migrations (database already set up)
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Running Prisma migrations...
    call npx prisma migrate dev --name init
    
    if %errorlevel% neq 0 (
        echo Error: Migration failed
        echo Make sure PostgreSQL is running and DATABASE_URL is correct
        exit /b 1
    )
    
    echo.
    echo Seeding database with test data...
    call npm run seed
) else (
    echo Skipping migrations...
)

echo.
echo ✨ Setup complete!
echo.
echo To start development server:
echo   npm run dev
echo.
echo Then visit: http://localhost:3000
echo.
echo Test credentials:
echo   Teacher:  teacher@college.edu / Teacher@123
echo   Student:  alice@college.edu / Student@123
echo.
pause
