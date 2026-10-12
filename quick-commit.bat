@echo off
REM Quick commit all remaining files at once
echo.
echo Adding all untracked and modified files...
git add -A
echo.
echo Creating single commit...
git commit -m "feat: complete aluminium window quotation system with all modules (auth, dashboard, quotations, design studio, inventory, billing, CRM, PDF generation, WhatsApp integration)"
echo.
echo Done! Commit created.
echo.
git log --oneline -1
echo.
echo Ready to push! Run: git push origin master
echo.
pause
