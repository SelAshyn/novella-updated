# PowerShell script to add Sentry environment variables to Vercel
# Run this script: .\vercel-sentry-setup.ps1

Write-Host "Adding Sentry environment variables to Vercel..." -ForegroundColor Cyan

# NEXT_PUBLIC_SENTRY_DSN
Write-Host "`nAdding NEXT_PUBLIC_SENTRY_DSN..." -ForegroundColor Yellow
"https://993ec807fddf9c8bc1f8200ab841c401@o4512337506926592.ingest.us.sentry.io/4512390798639104" | vercel env add NEXT_PUBLIC_SENTRY_DSN production preview development

# SENTRY_AUTH_TOKEN
Write-Host "`nAdding SENTRY_AUTH_TOKEN..." -ForegroundColor Yellow
"sntrys_eyJpYXQiOjE3MzExMDY3NjkuNDI5NTA5LCJ1cmwiOiJodHRwczovL3NlbnRyeS5pbyIsInJlZ2lvbl91cmwiOiJodHRwczovL3VzLnNlbnRyeS5pbyIsIm9yZyI6InNlbGFzaHlucy10ZWFtIn0=_6fd63e8cdab211f1954e4e0c1c421233" | vercel env add SENTRY_AUTH_TOKEN production preview development

# SENTRY_ORG
Write-Host "`nAdding SENTRY_ORG..." -ForegroundColor Yellow
"selashyns-team" | vercel env add SENTRY_ORG production preview development

# SENTRY_PROJECT
Write-Host "`nAdding SENTRY_PROJECT..." -ForegroundColor Yellow
"novella" | vercel env add SENTRY_PROJECT production preview development

Write-Host "`n✅ Done! Sentry environment variables added to Vercel." -ForegroundColor Green
Write-Host "Trigger a new deployment to use these variables." -ForegroundColor Cyan
