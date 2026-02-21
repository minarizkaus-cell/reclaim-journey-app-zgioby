# Registration Email Validation - Implementation Notes

## Overview

This document explains the implementation of comprehensive email validation logging to fix false "already in use" errors during user registration.

---

## Problem Addressed

Users were receiving "Email address already in use" errors when:
1. Registering with completely new emails
2. The email legitimately doesn't exist in the database
3. No actual conflict exists

**Root Cause:** Need for detailed logging to diagnose where false positives come from.

---

## Solution Implemented

### 1. Pre-Signup Email Check with Logging

**File:** `src/index.ts`

```typescript
// Before signup request is processed, check if email exists
app.fastify.addHook('preHandler', async (request) => {
  if (request.url?.includes('/api/auth/sign-up/email') && request.method === 'POST') {
    const body = request.body as { email?: string };
    const rawEmail = body?.email?.trim();
    const normalizedEmail = rawEmail?.toLowerCase();

    // Log what we received
    app.logger.info({
      path: request.url,
      method: request.method,
      rawEmail,
      normalizedEmail,
      hasPassword: !!body?.password,
      hasName: !!body?.name,
    }, 'Sign-up request received');

    // Check if email exists
    if (normalizedEmail) {
      try {
        const existingUser = await app.db
          .select({ id: authSchema.user.id, email: authSchema.user.email })
          .from(authSchema.user)
          .where(eq(authSchema.user.email, normalizedEmail));

        // Log the result
        app.logger.info({
          normalizedEmail,
          foundCount: existingUser.length,
          foundEmails: existingUser.map(u => u.email),
        }, 'Email database check completed');

        // If found, log as warning
        if (existingUser.length > 0) {
          app.logger.warn({
            normalizedEmail,
            existingEmails: existingUser.map(u => u.email),
          }, 'Sign-up attempt with already-existing email');
        }
      } catch (dbError) {
        app.logger.error({
          err: dbError,
          normalizedEmail,
          errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
        }, 'Error checking email existence in database during sign-up');
      }
    }
  }
});
```

**What This Does:**
- Intercepts every signup request
- Extracts and normalizes the email
- Queries database to check if email exists
- Logs the raw email, normalized email, and search result
- Identifies which emails were found (if any)

**Key Logged Data:**
- `rawEmail` - Original input from frontend
- `normalizedEmail` - Lowercased, trimmed version
- `foundCount` - Number of matching emails in database
- `foundEmails` - List of emails that matched

---

### 2. Error Logging on Signup Failure

**File:** `src/index.ts`

```typescript
// Log any errors that occur during signup
app.fastify.addHook('onError', async (request, reply, error) => {
  if (request.url?.includes('/api/auth/sign-up/email')) {
    const body = request.body as { email?: string };
    const rawEmail = body?.email?.trim();
    const normalizedEmail = rawEmail?.toLowerCase();

    app.logger.error({
      err: error,
      path: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      rawEmail,
      normalizedEmail,
      errorMessage: error?.message,
      errorCode: (error as any)?.code,
      errorDetails: (error as any)?.details,
    }, 'Auth signup endpoint error');
  }
});
```

**What This Does:**
- Captures any error that occurs during signup
- Logs the HTTP status code
- Logs the error message and error code
- Logs both raw and normalized email for context

**Key Logged Data:**
- `statusCode` - HTTP response code (409, 400, 500, etc.)
- `errorMessage` - Error description from Better Auth
- `errorCode` - Error code (if available)

---

### 3. Enhanced Email Check Endpoint

**File:** `src/routes/user.ts`

**Endpoint:** `POST /api/user/check-email`

```typescript
try {
  if (!isValidEmail(normalizedEmail)) {
    app.logger.warn({
      normalizedEmail,
      rawEmail,
    }, 'Email format validation failed');
    return reply.code(400).send({ error: 'Invalid email format' });
  }

  // Check if email already exists in database
  const existingUser = await app.db
    .select({ id: authSchema.user.id, email: authSchema.user.email })
    .from(authSchema.user)
    .where(eq(authSchema.user.email, normalizedEmail));

  const available = existingUser.length === 0;

  app.logger.info({
    normalizedEmail,
    available,
    existingCount: existingUser.length,
    existingEmails: existingUser.map(u => u.email),
  }, 'Email availability check completed successfully');

  return { available, email: normalizedEmail };
} catch (error) {
  app.logger.error({
    err: error,
    normalizedEmail,
    rawEmail,
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
  }, 'Email availability check failed');
  throw error;
}
```

**Improvements:**
- Logs raw and normalized email
- Logs validation failures
- Logs count and list of found emails
- Logs any database errors

---

### 4. Enhanced Validation Endpoint

**File:** `src/routes/user.ts`

**Endpoint:** `POST /api/user/validate-registration`

```typescript
// Check if email is available (only if email is valid)
let emailExists = false;
let foundEmails: string[] = [];
if (isValidEmail(normalizedEmail)) {
  const existingUser = await app.db
    .select({ id: authSchema.user.id, email: authSchema.user.email })
    .from(authSchema.user)
    .where(eq(authSchema.user.email, normalizedEmail));

  foundEmails = existingUser.map(u => u.email);

  // Log the check result
  app.logger.info({
    normalizedEmail,
    foundCount: existingUser.length,
    foundEmails,
  }, 'Email existence check completed during validation');

  if (existingUser.length > 0) {
    errors.push('Email address already in use');
    emailExists = true;
  }
}

const valid = errors.length === 0;

// Log final validation result
app.logger.info({
  email: normalizedEmail,
  valid,
  errorCount: errors.length,
  emailExists,
  foundEmails,
  errors,
}, 'Registration validation completed');
```

**Improvements:**
- Logs the database check result
- Logs count and list of found emails
- Logs all validation errors
- Provides complete picture of validation state

---

## How to Use the Logs

### To Debug "Already in Use" Error

1. **Find the error in logs:**
   ```
   [INFO] "Sign-up request received"
   [INFO] "Email database check completed"
   [ERROR] "Auth signup endpoint error"
   ```

2. **Check the `foundCount` value:**
   ```json
   {
     "normalizedEmail": "newuser@example.com",
     "foundCount": 0,  // <-- KEY VALUE
     "foundEmails": []
   }
   ```

3. **Interpret the result:**
   - `foundCount: 0` → Email doesn't exist (false positive)
   - `foundCount: 1` → Email exists (correct 409 response)
   - `foundCount: > 1` → Data corruption

4. **If false positive (`foundCount: 0` but still got 409):**
   - Better Auth is returning 409 incorrectly
   - Verify database actually doesn't have the email:
     ```sql
     SELECT * FROM "user" WHERE LOWER(email) = 'newuser@example.com';
     ```
   - If query returns 0, issue is in Better Auth error handling

### To Verify Case-Insensitive Matching

1. **Register "test@example.com"**
2. **Try to register "Test@Example.com"**
3. **Check logs for second attempt:**
   ```json
   {
     "rawEmail": "Test@Example.com",
     "normalizedEmail": "test@example.com",
     "foundCount": 1,
     "foundEmails": ["test@example.com"]
   }
   ```
4. **If `foundCount: 0`:** Case-insensitive index not working
   ```bash
   # Verify index exists
   SELECT * FROM pg_indexes WHERE indexname = 'user_email_lower_unique';
   ```

---

## Key Implementation Details

### Email Normalization

All emails are normalized to lowercase before:
1. Checking in database
2. Storing in database
3. Comparing with existing records

```typescript
const normalizedEmail = rawEmail?.toLowerCase().trim();
```

### Database Query

Case-insensitive check using normalized email:
```typescript
const existingUser = await app.db
  .select(...)
  .from(authSchema.user)
  .where(eq(authSchema.user.email, normalizedEmail));
```

This works because:
1. All emails in database are stored as lowercase
2. We always query with lowercase email
3. Database has case-insensitive unique index

### Logging Levels

- **INFO** - Normal operations (request received, check completed)
- **WARN** - Validation issues (email exists, weak password)
- **ERROR** - Failures (database error, signup failed)

---

## Testing the Implementation

### Test 1: New Email Should Work

```bash
EMAIL="test-$(date +%s)@example.com"
curl -X POST /api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Pass123!\",\"name\":\"User\"}"
```

**Expected logs:**
```
[INFO] Sign-up request received
  foundCount: 0

[Status 200 - Success]
```

### Test 2: Existing Email Should Fail

```bash
# Register first
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"existing@example.com\",\"password\":\"Pass123!\",\"name\":\"User1\"}"

# Try again with same email
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"existing@example.com\",\"password\":\"Pass123!\",\"name\":\"User2\"}"
```

**Expected logs:**
```
[INFO] Sign-up request received
  foundCount: 1

[WARN] Sign-up attempt with already-existing email

[ERROR] Auth signup endpoint error
  statusCode: 409

[Status 409 - Conflict]
```

### Test 3: Case Variant Should Fail

```bash
# Register with lowercase
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"casetest@example.com\",\"password\":\"Pass123!\",\"name\":\"User1\"}"

# Try with uppercase
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"CASETEST@EXAMPLE.COM\",\"password\":\"Pass123!\",\"name\":\"User2\"}"
```

**Expected logs on second attempt:**
```
[INFO] Sign-up request received
  rawEmail: "CASETEST@EXAMPLE.COM"
  normalizedEmail: "casetest@example.com"

[INFO] Email database check completed
  foundCount: 1
  foundEmails: ["casetest@example.com"]

[Status 409 - Conflict]
```

---

## Troubleshooting

### Problem: New email gets 409 but `foundCount: 0`

**Diagnosis:** Better Auth is returning 409 for a reason other than email conflict

**Check:**
1. Verify database doesn't have the email
2. Check error message in logs
3. May be password validation, not email

### Problem: Case-insensitive matching doesn't work

**Diagnosis:** Case-insensitive index missing or not being used

**Check:**
```sql
SELECT * FROM pg_indexes WHERE indexname = 'user_email_lower_unique';
```

**Fix:**
```bash
npm run db:migrate
```

### Problem: Can't see the logs

**Check:**
1. Application logging level may be set too high
2. May need to look in stdout/stderr
3. Verify application is actually running

---

## Summary

The implementation adds:

✅ **Detailed signup request logging** - See raw and normalized email
✅ **Database check logging** - Know if email exists before signup
✅ **Error logging** - Capture actual error codes and messages
✅ **Email validation logging** - Track validation endpoint calls
✅ **Comprehensive context** - All relevant data logged together

With these logs, any "already in use" error can be quickly diagnosed by checking the `foundCount` value to determine if the email actually exists in the database.
