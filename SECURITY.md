# Security Practices

This document outlines the security measures implemented in the Novella application.

## ✅ Security Measures Implemented

### 1. **Server-Side Validation & Rate Limiting**

All critical business logic and limits are enforced **server-side only**:

- **Book Limits**: Checked in `/app/api/books/route.ts` (POST)
- **Vocabulary Limits**: Checked in `/app/api/vocabulary/route.ts` (POST)
- **Plan Features**: Validated in API routes, not client-side
- **Payment Processing**: All payment logic server-side with Firebase Admin SDK

**Location**: 
- `app/api/books/route.ts` - Lines 43-54 (book limit enforcement)
- `app/api/vocabulary/route.ts` - Lines 43-59 (vocabulary limit enforcement)

### 2. **Authentication**

- Firebase Authentication for user identity
- Firebase Admin SDK for server-side token verification
- All API routes verify authentication before processing
- No authentication tokens exposed in client-side code

**Location**: All `app/api/**/route.ts` files use `resolveUser()` or Firebase Admin SDK

### 3. **No Sensitive Data in Console Logs**

Removed all console logs that could expose:
- User tokens or credentials
- Payment details
- Internal error messages with sensitive data
- API keys or secrets

**Client-side errors are generic** (e.g., "Failed to start payment") while server logs contain details for debugging.

### 4. **Environment Variables**

All secrets stored in `.env.local` (never committed):
- Firebase Admin credentials
- Cloudinary API secrets
- Database connection strings

**Important**: `.env.local` is in `.gitignore`

### 5. **Client-Side vs Server-Side**

**Client-Side** (UI only - can be bypassed by users):
- Plan limit warnings
- Usage indicators
- Form validation
- UI state management

**Server-Side** (enforced - cannot be bypassed):
- Plan limits (books, vocabulary)
- Authentication checks
- Payment processing
- Database operations
- Rate limiting

## 🔒 Security Checklist

- [x] All rate limits enforced server-side
- [x] No API keys in client code
- [x] No sensitive data in console logs
- [x] Authentication required for all protected routes
- [x] Payment processing server-side only
- [x] Environment variables in .gitignore
- [x] Client-side validation is UI-only
- [x] Server-side validation cannot be bypassed
- [x] Error messages are generic client-side

## 🚫 What Users Cannot Bypass

Even with browser console access, users **CANNOT**:

1. **Exceed plan limits** - Enforced in API routes
2. **Skip payment** - Verified server-side with payment gateway
3. **Access other users' data** - Auth verified per request
4. **Manipulate rate limits** - Checked on server
5. **Access Plus features** - Plan checked in database on every request

## 📝 Best Practices for Future Development

1. **Never trust client-side data** - Always validate server-side
2. **Never log sensitive information** - Use generic error messages
3. **Keep secrets in environment variables** - Never hardcode
4. **Validate authentication on every API call** - No exceptions
5. **Check permissions server-side** - Not in client code
6. **Use generic error messages** - Don't expose system details
7. **Test security** - Try to bypass your own limits

## 🔍 Security Testing

To verify security:

1. **Open browser console** on any page
2. Try to call APIs with modified data
3. Try to bypass plan limits
4. Verify server returns proper error codes (401, 403, 500)
5. Check network tab for exposed secrets (there should be none)

## 📧 Security Contact

If you discover a security vulnerability, please email: security@novella.app
