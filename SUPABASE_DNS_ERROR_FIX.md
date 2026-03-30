# Supabase DNS Resolution Error - Troubleshooting Guide

## Error: `net::ERR_NAME_NOT_RESOLVED`

This error means the browser cannot resolve the Supabase hostname `lrmihllhdwyyovolqovp.supabase.co`.

## Immediate Fix (Most Common)

### 1. **Restart Your Dev Server** ⭐ (Try this first!)
Vite needs to reload environment variables from the `.env` file:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it:
bun run dev
```

Why? If you created/modified the `.env` file after starting the dev server, Vite won't see the changes until you restart.

---

## Troubleshooting Steps

### 2. **Verify Environment Variables Are Loaded**
- Open your browser's **Developer Tools** (F12)
- Go to **Console** tab
- Look for log messages starting with `[Supabase Client]`
- Check if the URL appears:
  ```
  [Supabase Client] Initializing with URL: https://lrmihllhdwyyovolqovp.supabase.co
  ```

**If you see `undefined` instead of the URL**, the `.env` file isn't being loaded.

### 3. **Verify `.env` File Content**
Check `d:\parkpal-smartfind\.env` contains:
```
VITE_SUPABASE_PROJECT_ID="lrmihllhdwyyovolqovp"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_o2wRGFIwyB8nZnqsTMRn7g_9YgEUC1S"
VITE_SUPABASE_URL="https://lrmihllhdwyyovolqovp.supabase.co"
```

### 4. **Check Network Connectivity**
The Supabase endpoint might be unreachable:

**Option A: Test with curl**
```bash
# In PowerShell
Invoke-WebRequest -Uri "https://lrmihllhdwyyovolqovp.supabase.co" -Method HEAD
```

**Option B: Test with browser**
Open in a new tab: `https://lrmihllhdwyyovolqovp.supabase.co`

If you get a connection error, Supabase might be:
- Down for maintenance
- Project deleted or suspended
- Network firewall blocking the request

### 5. **Verify Supabase Project is Active**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Check if project `lrmihllhdwyyovolqovp` exists
3. Verify it's not suspended or deleted
4. Check project status under **Settings** → **General**

### 6. **Clear Browser Cache**
Sometimes old DNS cache causes issues:
```bash
# Then hard refresh in browser: Ctrl+Shift+R
# Or: DevTools → Network tab → Disable cache, then reload
```

---

## If Supabase Project is Down or Deleted

### Recreate a Supabase Project
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the new URL and API key
4. Update `.env`:
   ```
   VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your_new_key"
   ```
5. Restart dev server: `bun run dev`

---

## Quick Checklist

- [ ] Dev server restarted after `.env` changes?
- [ ] Supabase URL appears in browser console logs?
- [ ] `.env` file exists in project root `d:\parkpal-smartfind\.env`?
- [ ] Can reach `https://lrmihllhdwyyovolqovp.supabase.co` in browser?
- [ ] Supabase project still exists in dashboard?
- [ ] Project is active (not suspended)?

---

## Still Having Issues?

Check console output for more detailed errors:
1. Open DevTools DevTools (F12)
2. Check Console tab for `[Supabase Client]` logs
3. Look for CORS or authentication errors
4. Click on the network request that failed to see full error details
