# Complete Setup Guide

This guide will walk you through setting up the Aluminium Window Quotation System from scratch.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - Project Name: aluminium-windows
   - Database Password: (choose a strong password)
   - Region: (select closest to your users)
4. Click "Create new project"
5. Wait for the project to be created (2-3 minutes)

## Step 3: Get Supabase Credentials

1. In your Supabase project, go to **Project Settings** (gear icon)
2. Click on **API** in the left sidebar
3. Copy the following values:
   - **Project URL** (under Project URL)
   - **anon public** key (under Project API keys)
   - **service_role** key (under Project API keys)

## Step 4: Configure Environment Variables

1. Open `.env.local` file in the project root
2. Replace the placeholder values with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 5: Set Up Database Schema

1. In your Supabase project, click on **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase_setup.sql` from the project root
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

This creates:
- All database tables
- Row Level Security (RLS) policies
- Automatic functions and triggers
- Sample window templates

## Step 6: Verify Database Setup

1. In Supabase, go to **Table Editor**
2. You should see these tables:
   - profiles
   - clients
   - window_templates
   - window_designs
   - profiles_inventory
   - glass_inventory
   - accessories
   - quotations
   - invoices
   - calculation_formulas

3. Click on **window_templates** table
4. You should see 7 sample templates (Standard Sliding Window, Large Sliding Door, etc.)

## Step 7: Configure Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Under **Auth Settings**:
   - Enable **Confirm email**: OFF (for development)
   - Enable **Secure email change**: ON
   - Enable **Secure password change**: ON

## Step 8: Set Up URL Configuration (Optional for Development)

For local development with the design subdomain:

**Windows**:
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add line: `127.0.0.1 design.localhost`
4. Save the file

**Mac/Linux**:
```bash
sudo nano /etc/hosts
# Add this line:
127.0.0.1 design.localhost
```

## Step 9: Run the Application

```bash
npm run dev
```

The application should start at: http://localhost:3000

## Step 10: Create Your First Account

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Click "Sign up"
4. Fill in:
   - Full Name: Your name
   - Company Name: Your company
   - Email: Your email
   - Password: At least 6 characters
5. Click "Create Account"
6. You'll be redirected to the dashboard

## Step 11: Verify Everything Works

Check that you can:
- ✅ Sign up for a new account
- ✅ Log in with your credentials
- ✅ See the dashboard (even if it's basic)
- ✅ Log out

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file
- Ensure you copied the **anon public** key, not the service_role key
- Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

### "Email not confirmed" error
- Go to Supabase → Authentication → Providers
- Disable "Confirm email" for development
- Try signing up again

### Database tables not created
- Go back to SQL Editor
- Run the schema again
- Check for any error messages in red

### Page not loading
- Check that the dev server is running
- Try clearing your browser cache
- Open browser console (F12) to see errors

### "Cannot connect to Supabase"
- Verify your Supabase project is running (not paused)
- Check your internet connection
- Verify the Project URL is correct

## Next Steps

Once setup is complete, you can:
1. Add sample data (profiles, glass, accessories)
2. Create your first quotation
3. Design windows using templates
4. Generate PDFs
5. Set up WhatsApp integration (optional)

## Production Deployment

When deploying to production:

1. **Update Environment Variables**:
   - Use production URLs
   - Never commit `.env.local` to git

2. **Enable Email Confirmation**:
   - In Supabase → Authentication
   - Enable "Confirm email"
   - Configure email templates

3. **Set Up Custom Domain**:
   - Configure both main and design subdomains
   - Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_DESIGN_URL`

4. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

5. **Configure DNS**:
   - Add A record for main domain
   - Add CNAME record for design subdomain

## Security Checklist

Before going to production:

- [ ] Enable email confirmation
- [ ] Enable 2FA for Supabase account
- [ ] Rotate service_role key (if exposed)
- [ ] Set up database backups
- [ ] Enable RLS on all tables
- [ ] Review and test all RLS policies
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Add HTTPS redirect
- [ ] Set up proper CORS policies

## Support

Need help? Contact:
- Email: support@yourdomain.com
- Phone: 879475061, 8826619980

---

Last updated: 2026
