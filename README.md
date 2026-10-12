# Aluminium Window Quotation System

A premium window design and estimation software built for aluminium window & door businesses. Similar to SoftWinQuote, this system provides beautiful designs and instant quotations all in one place.

## Features

- **Smart Quotation Engine**: Generate pixel-perfect quotations with auto-calculation for aluminium profiles, glass area, accessories, and labour costs
- **Window Design Studio**: 200+ pre-built templates covering every window type
- **Business Analytics**: Live dashboards with revenue trends and quotation conversion rates
- **WhatsApp Integration**: One-click PDF delivery to clients
- **Billing & Invoicing**: Professional invoices with payment tracking
- **Profile & Stock Manager**: Comprehensive inventory management
- **Auto Cutting Lists**: Automatic cutting list generation per order
- **Elevation Views**: Architectural previews for client presentations
- **Separate Design Application**: Dedicated design subdomain for quotation designs

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: jsPDF & html2canvas
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand
- **UI Components**: Custom components with shadcn/ui patterns

## Project Structure

```
aluminium/
├── app/
│   ├── (auth)/          # Authentication pages (login, signup)
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page (redirects to login)
├── components/
│   ├── ui/              # Reusable UI components
│   ├── dashboard/       # Dashboard specific components
│   ├── quotations/      # Quotation components
│   ├── design/          # Design studio components
│   ├── inventory/       # Inventory management components
│   ├── billing/         # Billing components
│   └── crm/             # CRM components
├── lib/
│   ├── supabase/        # Supabase client setup
│   └── utils.ts         # Utility functions
├── types/               # TypeScript type definitions
├── store/               # Zustand state management
├── utils/               # Helper utilities
└── supabase-schema.sql  # Database schema

```

## Getting Started

### Database Change Workflow ⚠️

**IMPORTANT**: When making database changes, always follow this workflow:

1. **Add SQL to `updates.sql`** (never edit `supabase_setup.sql` directly)
2. **Copy & paste in Supabase SQL Editor** to test
3. **Update `supabase_setup.sql`** after confirmation
4. **Clear `updates.sql`** for next changes

See `DATABASE_WORKFLOW.md` for detailed instructions.

### Prerequisites

- Node.js 18+ installed
- A Supabase account (https://supabase.com)
- (Optional) WhatsApp Business API credentials

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at https://supabase.com
   - Go to Project Settings → API
   - Copy your project URL and anon key

3. **Configure environment variables**:
   - Edit `.env.local` file and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**:
   - Open Supabase SQL Editor
   - Copy and run the contents of `supabase_setup.sql`
   - This will create all necessary tables, policies, and sample data

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   - Navigate to http://localhost:3000
   - You'll be redirected to the login page
   - Create a new account using the signup page

### Setting up the Design Subdomain (Optional)

The design application runs on a separate subdomain (design.yourdomain.com). For local development:

1. **Configure hosts file** (for local testing):
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Mac/Linux: `/etc/hosts`
   - Add: `127.0.0.1 design.localhost`

2. **Update environment variables**:
   ```env
   NEXT_PUBLIC_DESIGN_URL=http://design.localhost:3000
   ```

3. The design app will be accessible at: `http://design.localhost:3000/?quotationId=<id>`

## Database Schema

The system includes the following main tables:

- **profiles**: User profiles with roles (admin, sales, accounts)
- **clients**: Client information and contact details
- **window_templates**: Pre-built window design templates
- **window_designs**: Custom window designs
- **profiles_inventory**: Aluminium/UPVC profiles stock
- **glass_inventory**: Glass types and stock levels
- **accessories**: Hardware and accessories inventory
- **quotations**: Quotation records with line items
- **invoices**: Invoice records with payment tracking
- **calculation_formulas**: Custom pricing formulas

## Key Features Implementation Status

### ✅ Task 1: Project Setup
- Next.js 14 with TypeScript
- Tailwind CSS configured
- Essential dependencies installed
- Project structure created

### 🔄 Task 2: Supabase Configuration (Current)
- Database schema designed
- Authentication configured
- Client/server setup complete

### ⏳ Remaining Tasks:
- Task 3: Authentication UI (Login/Signup)
- Task 4: Dashboard with analytics
- Task 5: Quotation management
- Task 6: Design studio
- Task 7: Design subdomain
- Task 8: Inventory management
- Task 9: Billing system
- Task 10: PDF generation
- Task 11: CRM module
- Task 12: WhatsApp integration

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Custom Domain Setup

For the design subdomain:
1. Add both domains: `yourdomain.com` and `design.yourdomain.com`
2. Configure DNS records
3. Update environment variables with production URLs

## Support

For issues or questions:
- Helpline: 879475061, 8826619980
- Email: support@yourdomain.com

## License

Proprietary - All rights reserved

---

Built with ❤️ for the aluminium window & door industry
