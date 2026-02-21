# Registration Flow Fix - Complete Documentation

## Problem Statement

Users were receiving "Email already in use" error for ALL registration attempts, even when registering with completely new email addresses that don't exist in the database.

## Root Causes Identified and Fixed

### 1. **Case-Sensitive Email Uniqueness Constraint**

**Problem:** PostgreSQL's default UNIQUE constraint is case-sensitive.
- Email "test@example.com" and "Test@Example.com" were treated as different values
- But Better Auth expected them to be treated as the same (case-insensitive)

**Fix:**
- Created migration `20260221_fix_email_uniqueness.sql`
- Dropped the case-sensitive UNIQUE constraint
- Created case-insensitive unique index: `CREATE UNIQUE INDEX user_email_lower_unique ON "user" (LOWER("email"))`
- Normalized all existing emails to lowercase in the database

### 2. **Missing Email Normalization**

**Problem:** Emails weren't being normalized to lowercase before:
- Storing in the database
- Querying the database
- Checking availability

**Fix:**
- Created `src/utils/auth-utils.ts` with:
  - `normalizeEmail()` - converts email to lowercase and trims whitespace
  - `isValidEmail()` - validates email format
  - `emailsMatch()` - compares emails case-insensitively
- Updated all email checks to use normalized emails
- Updated `/api/user/check-email` endpoint to normalize input

### 3. **Poor Error Logging and Diagnosis**

**Problem:** When registration failed, the actual database error wasn't being logged, making it impossible to diagnose the real issue.

**Fix:**
- Added comprehensive error logging in `src/index.ts`
  - All auth signup errors now log full details: message, code, status
- Added detailed logging to email checking endpoints
- Created diagnostic endpoints to inspect database state

## Changes Made

### Database Migrations

#### `20260221_fix_email_uniqueness.sql`
- Drops case-sensitive email UNIQUE constraint
- Creates case-insensitive unique index on `LOWER("email")`
- Normalizes all existing emails to lowercase

### New Files

#### `src/utils/auth-utils.ts`
Email utility functions for normalization and validation:
```typescript
normalizeEmail(email) // "Test@Example.COM" → "test@example.com"
isValidEmail(email)   // Validates format
emailsMatch(e1, e2)   // Case-insensitive comparison
```

### Modified Files

#### `src/routes/user.ts`

**New Endpoint: `POST /api/user/check-email`**
- Check if an email is available for registration
- Normalizes email to lowercase
- Returns: `{ available: boolean, email: string }`
- HTTP Status: 200 (success) or 400 (invalid format)

**New Endpoint: `GET /api/user/registration-test`**
- Diagnostic endpoint to inspect database state
- Lists all emails in database
- Detects duplicate emails (exact and case-insensitive)
- Returns: `{ totalUsers, emails[], duplicateEmails[], caseInsensitiveDuplicates[][], timestamp }`

**New Endpoint: `POST /api/user/validate-registration`**
- Validates complete registration data before attempting signup
- Checks: email format, name length, password strength, email availability
- Returns: `{ valid: boolean, errors: string[], email: string, suggestions: string }`
- HTTP Status: 200 with detailed error list

#### `src/index.ts`

**Added Error Logging Middleware:**
```typescript
app.fastify.addHook('onError', async (request, reply, error) => {
  if (request.url?.includes('/api/auth/sign-up/email')) {
    app.logger.error({
      err: error,
      path: request.url,
      statusCode: reply.statusCode,
      errorMessage: error?.message,
      errorCode: (error as any)?.code,
    }, 'Auth signup endpoint error');
  }
});
```

## How to Use

### 1. Pre-registration Validation (Frontend)

Call the validation endpoint before signup:
```bash
POST /api/user/validate-registration
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "email": "newuser@example.com",
  "suggestions": "Registration data is valid. Ready to proceed."
}
```

### 2. Check Email Availability Only

```bash
POST /api/user/check-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

Response:
```json
{
  "available": true,
  "email": "test@example.com"
}
```

### 3. Diagnose Issues

```bash
GET /api/user/registration-test
```

Response:
```json
{
  "status": "ok",
  "totalUsers": 5,
  "emails": ["test@example.com", "user@example.com", ...],
  "duplicateEmails": [],
  "caseInsensitiveDuplicates": [],
  "timestamp": "2026-02-21T10:30:00.000Z"
}
```

## Expected Behavior After Fix

### Scenario 1: New Email
```
Request:  POST /api/auth/sign-up/email (email: "newuser@example.com", password: "...", name: "...")
Response: 200 OK
          { user: { id, email, name }, session: { ... } }
```

### Scenario 2: Existing Email (Exact Match)
```
Request:  POST /api/auth/sign-up/email (email: "test@example.com", ...)
Response: 409 Conflict
          { error: "Email address already in use" }
```

### Scenario 3: Existing Email (Different Case)
```
Request:  POST /api/auth/sign-up/email (email: "Test@Example.com", ...)
Response: 409 Conflict (treated as same email due to case-insensitive index)
          { error: "Email address already in use" }
```

### Scenario 4: Invalid Email Format
```
Request:  POST /api/auth/sign-up/email (email: "invalid-email", ...)
Response: 400 Bad Request
          { error: "Invalid email format" }
```

### Scenario 5: Weak Password
```
Request:  POST /api/auth/sign-up/email (email: "new@example.com", password: "weak", ...)
Response: 400 Bad Request
          { error: "Password does not meet requirements", details: [...] }
```

## Testing Checklist

- [ ] New email "test1@example.com" → Registration succeeds → HTTP 200
- [ ] Existing email "test1@example.com" → Registration fails → HTTP 409
- [ ] Same email different case "Test1@Example.com" → Registration fails → HTTP 409
- [ ] Invalid email "test.invalid" → Validation fails → HTTP 400
- [ ] Weak password "pass" → Validation fails → HTTP 400
- [ ] Check `/api/user/registration-test` shows no duplicates
- [ ] Verify all logs show full error details (not masked as "email exists")

## Database Verification

To manually verify the database state:

```sql
-- Check the case-insensitive unique index exists
SELECT * FROM pg_indexes WHERE tablename = 'user' AND indexname = 'user_email_lower_unique';

-- Check for duplicate emails (case-insensitive)
SELECT LOWER(email), COUNT(*) FROM "user" GROUP BY LOWER(email) HAVING COUNT(*) > 1;

-- Verify all emails are lowercase
SELECT DISTINCT email FROM "user" WHERE email != LOWER(email);
```

## Notes

- The migration runs idempotently - safe to apply multiple times
- All existing emails are automatically normalized to lowercase
- New registrations will use normalized (lowercase) emails
- Better Auth's default behavior is preserved
- Email validation is case-insensitive throughout the system
