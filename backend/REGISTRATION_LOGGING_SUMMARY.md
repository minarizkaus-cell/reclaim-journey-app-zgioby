# Registration Logging Implementation Summary

## What Was Added

Comprehensive logging has been added to diagnose false "already in use" errors during user registration.

---

## Changes Made

### 1. src/index.ts - Added Detailed Signup Logging

**Import Added:**
```typescript
import { eq } from 'drizzle-orm';
```

**PreHandler Hook - Logs Incoming Signup Requests:**
```typescript
app.fastify.addHook('preHandler', async (request) => {
  if (request.url?.includes('/api/auth/sign-up/email') && request.method === 'POST') {
    // Logs:
    // - Raw email from request body
    // - Normalized email (lowercased)
    // - Whether password and name are provided

    // Checks database to see if email exists
    // Logs: foundCount, foundEmails
  }
});
```

**Logs:**
1. `"Sign-up request received"` - Raw and normalized email
2. `"Email database check completed"` - How many matching emails found
3. `"Sign-up attempt with already-existing email"` - If email exists (WARN level)

**Error Hook - Captures Signup Failures:**
```typescript
app.fastify.addHook('onError', async (request, reply, error) => {
  if (request.url?.includes('/api/auth/sign-up/email')) {
    // Logs full error details including:
    // - HTTP status code
    // - Raw and normalized email
    // - Error message and code
  }
});
```

---

### 2. src/routes/user.ts - Enhanced Validation Logging

#### POST /api/user/check-email
**New Logging:**
- Request received with raw/normalized email
- Format validation failure (if any)
- Database check result (count and found emails)
- Any errors during check

**Example log:**
```json
{
  "normalizedEmail": "test@example.com",
  "foundCount": 1,
  "existingEmails": ["test@example.com"]
}
```

#### POST /api/user/validate-registration
**New Logging:**
- Request received
- Email database check result (detailed)
  ```json
  {
    "normalizedEmail": "test@example.com",
    "foundCount": 0,
    "foundEmails": []
  }
  ```
- Validation completion with all errors found
  ```json
  {
    "email": "test@example.com",
    "valid": false,
    "errorCount": 1,
    "emailExists": true,
    "foundEmails": ["test@example.com"],
    "errors": ["Email address already in use"]
  }
  ```

---

## What Gets Logged

### For Every Signup Attempt

1. **Request Details**
   - Raw email from frontend
   - Normalized email (lowercased and trimmed)
   - Whether password is present
   - Whether name is present

2. **Database Check**
   - Count of matching emails found
   - List of found emails
   - Any database errors

3. **Result**
   - HTTP status code (200, 400, 409, 500)
   - Error message from Better Auth
   - Error code (if available)

---

## Key Information to Find in Logs

### To Debug "Already in Use" Error

**Search for:** `"Email database check completed"`

**Expected output:**
```json
{
  "normalizedEmail": "newemail@example.com",
  "foundCount": 0,
  "foundEmails": []
}
```

**What it means:**
- `foundCount: 0` → Email doesn't exist, safe to register
- `foundCount: 1` → Email exists, should return 409
- `foundCount: > 1` → Database corruption (duplicate emails)

### To Verify Email Normalization

**Search for:** `"Sign-up request received"`

**Expected output:**
```json
{
  "rawEmail": "Test@Example.COM",
  "normalizedEmail": "test@example.com"
}
```

**What it means:**
- If these are different: normalization is working
- If they're identical: email was already lowercase

### To See Actual Error Code

**Search for:** `"Auth signup endpoint error"`

**Expected output:**
```json
{
  "statusCode": 409,
  "errorCode": "EMAIL_CONFLICT",
  "errorMessage": "Email address already in use"
}
```

**Status codes:**
- 200 OK: Success
- 400 Bad Request: Validation error (format, password)
- 409 Conflict: Email already exists
- 500 Server Error: Database/server issue

---

## Logging Flow Example

### Successful New User Registration

```
1. [INFO] Sign-up request received
   rawEmail: "newuser@example.com"
   normalizedEmail: "newuser@example.com"

2. [INFO] Email database check completed
   foundCount: 0
   foundEmails: []

(No error log = signup succeeded)
Status: 200 OK
```

### Duplicate Email Attempt

```
1. [INFO] Sign-up request received
   rawEmail: "existing@example.com"
   normalizedEmail: "existing@example.com"

2. [INFO] Email database check completed
   foundCount: 1
   foundEmails: ["existing@example.com"]

3. [WARN] Sign-up attempt with already-existing email
   normalizedEmail: "existing@example.com"

4. [ERROR] Auth signup endpoint error
   statusCode: 409
   errorMessage: "Email address already in use"

Status: 409 Conflict
```

### Case-Insensitive Matching

```
1. [INFO] Sign-up request received
   rawEmail: "Test@Example.COM"
   normalizedEmail: "test@example.com"

2. [INFO] Email database check completed
   foundCount: 1
   foundEmails: ["test@example.com"]
   ↑ Found email (case-insensitive match working!)

3. [WARN] Sign-up attempt with already-existing email
4. [ERROR] Auth signup endpoint error with statusCode: 409
```

---

## Using Logs to Debug Issues

### Issue: "Already in Use" for New Email

**Check Steps:**
1. Find `"Sign-up request received"` → verify rawEmail
2. Find `"Email database check completed"` → check foundCount
3. If `foundCount: 0` but still got 409 → Better Auth issue
4. If `foundCount: 1` → email really exists (verify with DB query)

### Issue: Case Variants Not Being Blocked

**Check Steps:**
1. Register "test@example.com"
2. Try to register "Test@Example.COM"
3. Look for `"Email database check completed"`
4. Should show `foundCount: 1` and `foundEmails: ["test@example.com"]`
5. If `foundCount: 0` → case-insensitive index missing

### Issue: Database Connection Error

**Check Steps:**
1. Look for `"Email database check failed"` or similar
2. Check errorMessage for "Connection refused" or "timeout"
3. Verify database is running
4. Check connection string in environment

---

## Log Output Format

All logs include:
- **Timestamp** - When the operation occurred
- **Level** - INFO, WARN, ERROR
- **Message** - What happened
- **Context** - Key-value pairs with details:
  - `normalizedEmail` - The lowercased email being checked
  - `foundCount` - How many matching emails found
  - `foundEmails` - List of matching emails
  - `statusCode` - HTTP response code
  - `errorMessage` - Error description
  - `errorCode` - Error code (if available)

---

## Benefits of These Logs

✅ **Visibility** - See exactly what's being checked
✅ **Debugging** - Quickly find why a registration failed
✅ **Verification** - Confirm email normalization works
✅ **Audit Trail** - Track all signup attempts
✅ **Diagnosis** - Distinguish between:
   - Email actually exists (correct 409)
   - Email doesn't exist but got 409 anyway (bug)
   - Database error (500)
   - Validation error (400)

---

## Testing the Logs

### Test 1: Verify Email Normalization
```bash
# Register with mixed-case email
EMAIL="Test123@Example.COM"
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Pass123!\",\"name\":\"User\"}"

# Check logs:
# Should see rawEmail: "Test123@Example.COM"
# Should see normalizedEmail: "test123@example.com"
```

### Test 2: Verify Database Check
```bash
# Try existing email
EMAIL="test@example.com"  # Assuming this exists
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Pass123!\",\"name\":\"User2\"}"

# Check logs:
# Should see foundCount: 1
# Should see foundEmails: ["test@example.com"]
# Should see statusCode: 409
```

### Test 3: Verify New Email Works
```bash
# Register with unique email
EMAIL="unique-$(date +%s)@example.com"
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Pass123!\",\"name\":\"NewUser\"}"

# Check logs:
# Should see foundCount: 0
# Should NOT see error log
# Should see statusCode: 200 or similar success
```

---

## Summary

The logging implementation provides:

1. **Visibility into email checks:**
   - What email is being checked (raw and normalized)
   - Whether it exists in database (foundCount)
   - Which emails were found (foundEmails)

2. **Error tracking:**
   - Actual HTTP status codes
   - Real error messages from Better Auth
   - Database connection errors

3. **Easy debugging:**
   - Search logs for key messages
   - Check foundCount to understand if email exists
   - Compare raw vs normalized email to verify normalization

4. **Comprehensive audit trail:**
   - Every signup attempt is logged
   - All errors captured with details
   - Can track patterns of false positives

With these logs, any "already in use" error can be quickly diagnosed by checking if `foundCount` matches whether the email actually exists.
