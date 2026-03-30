# Supabase Setup Guide - DNS Error Resolution

## Problem
Your `.env` contains a Supabase project ID `lrmihllhdwyyovolqovp` that **no longer exists or was never created**.

DNS lookup shows: `Non-existent domain` for `lrmihllhdwyyovolqovp.supabase.co`

## Solution: Set Up a Real Supabase Project

### Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Project name**: e.g., "ParkPal"
   - **Database password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
4. Wait for project to be created (2-3 minutes)

### Step 2: Get Your Project Credentials

After project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **Project ID**: The part before `.supabase.co` (also shows as "ref")
   - **Publishable API Key** (anon key): Under "Project API keys"

### Step 3: Update Your `.env` File

Replace the old values with your new credentials:

```env
VITE_SUPABASE_PROJECT_ID="YOUR_NEW_PROJECT_ID"
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_PUBLISHABLE_KEY"
VITE_ADMIN_WHATSAPP_NUMBER="917904295652||917708112357"
```

**Example:**
```env
VITE_SUPABASE_PROJECT_ID="abcdefghijklmnop"
VITE_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Paste contents from `supabase/migrations/20260129000000_consolidated_schema.sql`
4. Click **"Execute"**

This creates all tables and sets up RLS policies.

### Step 5: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Restart with new credentials
bun run dev
```

### Step 6: Verify It Works

1. Open app in browser
2. Press **F12** → **Console**
3. Look for log message:
   ```
   [Supabase Client] Initializing with URL: https://YOUR_NEW_PROJECT_ID.supabase.co
   [Supabase Client] Has publishable key: true
   ```

4. If you see `undefined` or errors, double-check:
   - `.env` file has correct values (no spaces, no quotes duplicated)
   - Dev server was restarted AFTER updating `.env`
   - Supabase project URL is correct

---

## Testing the Connection

### Test DNS Resolution
```bash
ping YOUR_NEW_PROJECT_ID.supabase.co
```

Should see successful replies, not "host not found"

### Test API Connection
Open in browser:
```
https://YOUR_NEW_PROJECT_ID.supabase.co/rest/v1/parking_lots?select=*
```

Should show JSON array (or error about missing table, which is fine)

---

## Current Status

- ✅ App has **mock data fallback** - will still show parking lots if Supabase fails
- ❌ **DNS error** because project doesn't exist
- ⏳ **Needs**: Valid Supabase project credentials in `.env`

---

## Troubleshooting

### Still seeing "net::ERR_NAME_NOT_RESOLVED" after setup?

1. **Verify DNS works locally:**
   ```bash
   # PowerShell
   nslookup YOUR_PROJECT_ID.supabase.co
   ```
   
   Should show an IP address, not "Non-existent domain"

2. **Check `.env` is actually loaded:**
   - Open DevTools Console (F12)
   - Look for `[Supabase Client]` logs
   - If you see `undefined` URL, `.env` wasn't loaded → restart dev server

3. **Verify Supabase project is active:**
   - [Supabase Dashboard](https://app.supabase.com)
   - Project should show green status
   - Check it hasn't been suspended

4. **Try hard refresh:**
   - Press **Ctrl+Shift+R** in browser
   - Or clear cache in DevTools → Network tab → "Disable cache"

---

## How the App Handles Supabase Failures

Even if Supabase is down or DNS fails:

1. Query attempts to fetch from `parking_lots` table
2. If error occurs:
   - Checks for specific table-not-found errors → suggests running setup SQL
   - For any other error → uses mock data with warning toast
3. **Mock data** is always available as fallback (5 parking lots)

So the app will ALWAYS show something, even if Supabase is completely unavailable.
