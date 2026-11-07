#!/bin/bash
# Add Sentry environment variables to Vercel
# Run this script: bash vercel-sentry-setup.sh

echo "Adding Sentry environment variables to Vercel..."

vercel env add NEXT_PUBLIC_SENTRY_DSN production preview development << EOF
https://993ec807fddf9c8bc1f8200ab841c401@o4512337506926592.ingest.us.sentry.io/4512390798639104
EOF

vercel env add SENTRY_AUTH_TOKEN production preview development << EOF
sntrys_eyJpYXQiOjE3MzExMDY3NjkuNDI5NTA5LCJ1cmwiOiJodHRwczovL3NlbnRyeS5pbyIsInJlZ2lvbl91cmwiOiJodHRwczovL3VzLnNlbnRyeS5pbyIsIm9yZyI6InNlbGFzaHlucy10ZWFtIn0=_6fd63e8cdab211f1954e4e0c1c421233
EOF

vercel env add SENTRY_ORG production preview development << EOF
selashyns-team
EOF

vercel env add SENTRY_PROJECT production preview development << EOF
novella
EOF

echo "✅ Done! Sentry environment variables added to Vercel."
echo "Trigger a new deployment to use these variables."
