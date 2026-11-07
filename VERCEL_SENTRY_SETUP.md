# Adding Sentry to Vercel - Step by Step Guide

## Quick Setup (Recommended)

### Using the PowerShell Script

Run this command in your project directory:

```powershell
.\vercel-sentry-setup.ps1
```

This will automatically add all 4 Sentry environment variables to all Vercel environments (Production, Preview, Development).

---

## Manual Setup (Alternative)

If you prefer to add them manually through the Vercel dashboard:

### Step 1: Go to Vercel Dashboard

1. Open https://vercel.com/dashboard
2. Select your project: **novella** (or whatever your project name is)
3. Click **Settings** in the top navigation
4. Click **Environment Variables** in the left sidebar

### Step 2: Add Each Variable

Add these 4 environment variables one by one:

#### Variable 1: NEXT_PUBLIC_SENTRY_DSN
- **Key:** `NEXT_PUBLIC_SENTRY_DSN`
- **Value:** 
  ```
  https://993ec807fddf9c8bc1f8200ab841c401@o4512337506926592.ingest.us.sentry.io/4512390798639104
  ```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 2: SENTRY_AUTH_TOKEN
- **Key:** `SENTRY_AUTH_TOKEN`
- **Value:** 
  ```
  sntrys_eyJpYXQiOjE3MzExMDY3NjkuNDI5NTA5LCJ1cmwiOiJodHRwczovL3NlbnRyeS5pbyIsInJlZ2lvbl91cmwiOiJodHRwczovL3VzLnNlbnRyeS5pbyIsIm9yZyI6InNlbGFzaHlucy10ZWFtIn0=_6fd63e8cdab211f1954e4e0c1c421233
  ```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 3: SENTRY_ORG
- **Key:** `SENTRY_ORG`
- **Value:** 
  ```
  selashyns-team
  ```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

#### Variable 4: SENTRY_PROJECT
- **Key:** `SENTRY_PROJECT`
- **Value:** 
  ```
  novella
  ```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### Step 3: Redeploy

After adding all variables, trigger a new deployment:

**Option A: Redeploy from Dashboard**
1. Go to your project's **Deployments** tab
2. Click the ⋯ (three dots) menu on your latest deployment
3. Click **Redeploy**

**Option B: Push a new commit**
```bash
git add .
git commit -m "Add Sentry error monitoring"
git push
```

**Option C: Manual deployment**
```bash
vercel --prod
```

---

## Verification

### 1. Check Build Logs

Once deployed, check your Vercel build logs for Sentry activity:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Look for **Building** section
4. You should see messages about Sentry source map uploads

### 2. Test Error Tracking

Visit your deployed app and trigger a test error:

```javascript
// Add this temporarily to any client component
throw new Error("Sentry test from Vercel production");
```

Then check your Sentry dashboard at:
https://sentry.io/organizations/selashyns-team/projects/novella/

### 3. Check Source Maps

In Sentry, when you see an error:
1. The stack trace should show **original TypeScript file names** (not minified)
2. You should see **actual line numbers** from your source code
3. Click on a frame to see the **actual source code**

If you see minified code instead, source maps weren't uploaded correctly.

---

## Troubleshooting

### Source Maps Not Uploading

**Problem:** Stack traces show minified code instead of original TypeScript

**Solutions:**
1. Verify `SENTRY_AUTH_TOKEN` is set correctly in Vercel
2. Check build logs for upload errors
3. Ensure the token has these permissions:
   - `project:releases`
   - `project:write`

### No Events in Sentry

**Problem:** Errors aren't appearing in Sentry dashboard

**Solutions:**
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel (all environments)
2. Check browser console for Sentry-related errors
3. Ensure errors are happening in **production** (dev errors are filtered out by default)
4. Try disabling ad-blockers (they sometimes block Sentry)

### Build Failing After Adding Sentry

**Problem:** Vercel build fails with Sentry-related errors

**Solutions:**
1. Check if all 4 variables are set correctly
2. Ensure `SENTRY_ORG` is just the slug, not the full URL
3. Clear build cache: Settings → General → Clear Cache
4. Check `next.config.ts` syntax is correct

---

## Environment Variable Summary

Here's a quick reference of what each variable does:

| Variable | Used At | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Runtime (browser & server) | Tells Sentry SDK where to send events |
| `SENTRY_AUTH_TOKEN` | Build time only | Authenticates source map uploads |
| `SENTRY_ORG` | Build time only | Identifies your Sentry organization |
| `SENTRY_PROJECT` | Build time only | Identifies which project to upload to |

**Note:** Only `NEXT_PUBLIC_SENTRY_DSN` is exposed to the browser. The others are only used during the build process and never reach the client.

---

## Next Steps After Setup

1. ✅ Variables added to Vercel
2. ✅ New deployment triggered
3. ✅ Build logs checked (source maps uploaded)
4. ✅ Test error sent
5. ✅ Error appears in Sentry with readable stack trace
6. 🎉 You're done!

Now all errors in production will automatically be tracked in your Sentry dashboard with full context, user information, and breadcrumbs.
