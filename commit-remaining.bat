@echo off
REM Git Commit Script - 10 Organized Commits (Fixed for remaining files)
REM Run with: commit-remaining.bat

echo.
echo Starting Git Commits for Remaining Files...
echo.

REM Commit 1: Database Schema & Tools
echo [1/10] Database Schema and Tools...
git add supabase_setup.sql updates.sql test-supabase-connection.js
git commit -m "feat: add complete database schema with RLS policies and connection tester"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 2: Utility Libraries
echo [2/10] Utility Libraries...
git add lib/calculations.ts lib/utils.ts
git commit -m "feat: add calculation engine and utility functions for cost estimation"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 3: Authentication Pages
echo [3/10] Authentication Pages...
git add "app/(auth)/"
git commit -m "feat: implement authentication system with login and signup pages"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 4: Dashboard Layout & Components
echo [4/10] Dashboard Layout and Components...
git add components/dashboard/
git commit -m "feat: create dashboard components with sidebar, header, and analytics cards"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 5: Dashboard Pages - Main
echo [5/10] Dashboard Main Page...
git add "app/(dashboard)/"
git commit -m "feat: build dashboard pages with real-time metrics and navigation"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 6: Design Studio
echo [6/10] Design Studio...
git add app/design/ components/design/
git commit -m "feat: implement design studio with window templates and custom design builder"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 7: Quotation Components
echo [7/10] Quotation Components...
git add components/quotations/
git commit -m "feat: add quotation components for PDF download and WhatsApp sending"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 8: PDF Generation
echo [8/10] PDF Generation...
git add lib/pdf-generator.ts
git commit -m "feat: add professional PDF generation for quotations with company branding"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 9: WhatsApp Integration
echo [9/10] WhatsApp Integration...
git add lib/whatsapp.ts
git commit -m "feat: implement WhatsApp integration for sending quotations to clients"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

REM Commit 10: Documentation & Scripts
echo [10/10] Documentation and Scripts...
git add README.md SETUP.md commit-all.bat commit-all.sh
git commit -m "docs: add comprehensive documentation, setup guide, and commit scripts"
if %errorlevel% neq 0 (
    echo Warning: Some files may already be committed
)
echo Done
echo.

echo ========================================
echo All commits completed!
echo ========================================
echo.
echo Recent commits:
git log --oneline -10
echo.
echo Ready to push! Run: git push origin master
echo.
pause
