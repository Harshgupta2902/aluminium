@echo off
REM Git Commit Script - 10 Organized Commits
REM Run with: commit-all.bat

echo.
echo Starting Git Commits...
echo.

REM Commit 1: Project Configuration
echo [1/10] Project Configuration...
git add package.json package-lock.json tsconfig.json next.config.ts eslint.config.mjs next-env.d.ts .gitignore
git commit -m "feat: initialize Next.js 14 project with TypeScript configuration and dependencies"
echo Done
echo.

REM Commit 2: Base Styling & Layout
echo [2/10] Base Styling and Layout...
git add app/globals.css app/layout.tsx app/page.tsx public/
git commit -m "feat: set up base styles, root layout, and home page routing"
echo Done
echo.

REM Commit 3: UI Components
echo [3/10] UI Components...
git add components/ui/
git commit -m "feat: add reusable UI components (Button, Input, Card, Select, Label, Textarea)"
echo Done
echo.

REM Commit 4: Supabase Integration
echo [4/10] Supabase Integration...
git add lib/supabase/ types/ middleware.ts
git commit -m "feat: configure Supabase client, server, and middleware with TypeScript types"
echo Done
echo.

REM Commit 5: Database Schema
echo [5/10] Database Schema and Tools...
git add supabase_setup.sql updates.sql DATABASE_WORKFLOW.md test-supabase-connection.js
git commit -m "feat: add complete database schema with RLS policies, workflow docs, and connection tester"
echo Done
echo.

REM Commit 6: Authentication
echo [6/10] Authentication System...
git add app/(auth)/
git commit -m "feat: implement authentication system with login and signup pages"
echo Done
echo.

REM Commit 7: Dashboard Layout
echo [7/10] Dashboard Layout and Components...
git add app/(dashboard)/layout.tsx components/dashboard/
git commit -m "feat: create dashboard layout with sidebar, header, and analytics components"
echo Done
echo.

REM Commit 8: Main Dashboard & Quotations
echo [8/10] Main Dashboard and Quotations...
git add app/(dashboard)/dashboard/page.tsx app/(dashboard)/dashboard/quotations/ lib/calculations.ts lib/utils.ts
git commit -m "feat: build main dashboard with real-time metrics and quotation management with auto-calculations"
echo Done
echo.

REM Commit 9: Design Studio & Inventory
echo [9/10] Design Studio and Inventory...
git add app/(dashboard)/dashboard/designs/ app/(dashboard)/dashboard/inventory/ app/design/ components/design/
git commit -m "feat: implement design studio with 200+ templates and inventory management system"
echo Done
echo.

REM Commit 10: Billing, CRM, PDF & Integrations
echo [10/10] Billing, CRM, PDF and Integrations...
git add app/(dashboard)/dashboard/billing/ app/(dashboard)/dashboard/clients/ app/(dashboard)/dashboard/settings/ components/quotations/ lib/pdf-generator.ts lib/whatsapp.ts README.md SETUP.md CREDENTIALS_STATUS.md COMMIT_STRATEGY.md
git commit -m "feat: add billing system, CRM module, PDF generation, and WhatsApp integration with complete documentation"
echo Done
echo.

echo ========================================
echo All 10 commits completed successfully!
echo ========================================
echo.
echo Recent commits:
git log --oneline -10
echo.
echo Ready to push! Run: git push origin master
echo.
pause
