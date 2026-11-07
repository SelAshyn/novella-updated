# Sentry Error Monitoring Setup

Sentry is now configured for error monitoring in the Novella app. Follow these steps to complete the setup.

## 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project and select "Next.js" as the platform
3. Note the DSN (Data Source Name) that Sentry provides

## 2. Configure Environment Variables

Add these variables to your `.env.local` file (for development) and to your Vercel project settings (for production):

```bash
# Required for runtime error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# Required for source map uploads (production builds)
SENTRY_AUTH_TOKEN=your-auth-token-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

### Getting Your Values:

- **DSN**: Found in Sentry → Settings → Projects → [Your Project] → Client Keys (DSN)
- **Auth Token**: Go to Sentry → Settings → Auth Tokens → Create New Token
  - Give it a name like "Vercel/CI Uploads"
  - Grant permissions: `project:releases` and `project:write`
- **Org Slug**: Found in your Sentry URL: `https://sentry.io/organizations/<org-slug>/`
- **Project Slug**: Found in Sentry → Settings → Projects → [Your Project] → General Settings

## 3. Verify Local Setup

The SDK is configured to only send events in production by default. To test locally:

1. Temporarily set `enabled: true` in `sentry.client.config.ts`
2. Trigger an error in your app
3. Check the Sentry dashboard for the event
4. Revert the change

## 4. What's Included

### Client-Side Monitoring (`sentry.client.config.ts`)
- Error tracking with full stack traces
- Performance monitoring (10% sample rate in production)
- Session replay (10% sample rate, 100% on errors)
- Privacy-first: masks all text and media by default

### Server-Side Monitoring (`sentry.server.config.ts`)
- API route error tracking
- Server Component error tracking
- Performance monitoring (20% sample rate in production)
- Filtered errors: ignores common auth failures and Next.js navigation

### Edge Monitoring (`sentry.edge.config.ts`)
- Middleware error tracking
- Edge runtime error tracking
- Performance monitoring (20% sample rate in production)

### Build-Time Features (`next.config.ts`)
- Automatic source map uploads to Sentry
- Source maps deleted after upload (keeps build size small)
- React component annotations for better error context
- Automatic instrumentation of Server Components and API routes

## 5. Vercel Deployment

When deploying to Vercel:

1. Add all Sentry environment variables to your Vercel project:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
   - Make sure to set them for all environments (Production, Preview, Development)

2. The build will automatically upload source maps to Sentry

3. Errors will start appearing in your Sentry dashboard once deployed

## 6. Monitoring Best Practices

### Filter Noise
The server config already filters common non-actionable errors:
- Firebase auth errors (user-caused)
- Next.js navigation redirects

### Source Maps
Source maps are automatically uploaded during production builds when `SENTRY_AUTH_TOKEN` is set. This allows you to see readable stack traces in Sentry instead of minified code.

### Performance Monitoring
Adjust sample rates in the config files based on your traffic:
- Higher traffic → lower sample rate
- Lower traffic → higher sample rate

### Session Replay
Session replay captures user interactions before errors occur. It's configured with:
- 10% of normal sessions
- 100% of sessions with errors
- All text and media masked for privacy

To adjust privacy settings, modify the `replayIntegration` options in `sentry.client.config.ts`.

## 7. Testing

To test that Sentry is working:

```typescript
// Add this to any client component temporarily
throw new Error("Sentry test error");
```

Or use Sentry's built-in test button in your project settings.

## Troubleshooting

### Source Maps Not Uploading
- Verify `SENTRY_AUTH_TOKEN` is set in your build environment
- Check that the token has `project:releases` and `project:write` permissions
- Look for error messages in the build logs

### No Events Appearing
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check that `enabled: true` or `NODE_ENV === 'production'`
- Look for errors in the browser console (right-click → Inspect → Console)

### Build Errors
- Ensure `@sentry/nextjs` is installed: `npm install @sentry/nextjs`
- Clear `.next` folder: `rm -rf .next` or `Remove-Item -Recurse -Force .next`
- Rebuild: `npm run build`

## Files Modified

- `next.config.ts` - Sentry build configuration
- `sentry.client.config.ts` - Browser error monitoring
- `sentry.server.config.ts` - Server-side error monitoring
- `sentry.edge.config.ts` - Edge runtime error monitoring
- `instrumentation.ts` - Initializes Sentry based on runtime
- `.env.example` - Documents required environment variables
