# Registration Logging Guide

This document explains all the logging added to fix registration email validation issues.

## Overview

Comprehensive logging has been added to track every step of the email validation and signup process, making it easy to identify where false "already in use" errors are occurring.

---

## Sign-Up Request Flow with Logging

### 1. Sign-Up Request Received
**When:** Before Better Auth processes the signup request
**Log Level:** INFO
**Message:** `"Sign-up request received"`
**Logged Data:**
```json
{
  "path": "/api/auth/sign-up/email",
  "method": "POST",
  "rawEmail": "Test@Example.COM",
  "normalizedEmail": "test@example.com",
  "hasPassword": true,
  "hasName": true
}
```
**What to look for:**
- ✓ `rawEmail` shows the original input from frontend
- ✓ `normalizedEmail` shows the lowercased version used for checks
- If these are different, email normalization is working
- If they're identical, the email was already lowercase

---

### 2. Email Database Check
**When:** During sign-up request processing, checking if email already exists
**Log Level:** INFO
**Message:** `"Email database check completed"`
**Logged Data:**
```json
{
  "normalizedEmail": "test@example.com",
  "foundCount": 0,
  "foundEmails": []
}
```
**What to look for:**
- `foundCount: 0` → Email doesn't exist (safe to register)
- `foundCount: 1` → Email exists (should return 409 Conflict)
- `foundCount: > 1` → Data corruption (should be unique)
- `foundEmails` → Lists all matching emails (should be 0 or 1)

---

### 3. Sign-Up Attempt with Existing Email (Warning)
**When:** User attempts to register with an email that already exists
**Log Level:** WARN
**Message:** `"Sign-up attempt with already-existing email"`
**Logged Data:**
```json
{
  "normalizedEmail": "test@example.com",
  "existingEmails": ["test@example.com"]
}
```
**What to look for:**
- This indicates the email check passed and found existing users
- Better Auth should return 409 Conflict after this
- If you still see registration success after this, there's a bypass issue

---

### 4. Sign-Up Endpoint Error
**When:** Better Auth signup endpoint returns an error
**Log Level:** ERROR
**Message:** `"Auth signup endpoint error"`
**Logged Data:**
```json
{
  "path": "/api/auth/sign-up/email",
  "method": "POST",
  "statusCode": 409,
  "rawEmail": "test@example.com",
  "normalizedEmail": "test@example.com",
  "errorMessage": "Email address already in use",
  "errorCode": "EMAIL_CONFLICT"
}
```
**What to look for:**
- `statusCode: 409` → Email conflict (expected behavior)
- `statusCode: 400` → Validation error (invalid format, weak password)
- `statusCode: 500` → Server error (database issue)
- `errorMessage` → Exact error from Better Auth
- Compare `rawEmail` vs `normalizedEmail` to verify normalization

---

## Email Validation Endpoints Logging

### POST /api/user/check-email

#### Request Received
**Log Level:** INFO
**Message:** `"POST /api/user/check-email - received email check request"`
**Data:**
```json
{
  "rawEmail": "Test@Example.COM",
  "normalizedEmail": "test@example.com"
}
```

#### Format Validation Failed
**Log Level:** WARN
**Message:** `"Email format validation failed"`
**Data:**
```json
{
  "normalizedEmail": "invalid-email",
  "rawEmail": "invalid-email"
}
```

#### Check Completed
**Log Level:** INFO
**Message:** `"Email availability check completed successfully"`
**Data:**
```json
{
  "normalizedEmail": "test@example.com",
  "available": false,
  "existingCount": 1,
  "existingEmails": ["test@example.com"]
}
```
**Interpretation:**
- `available: true` → Email can be registered
- `available: false` → Email already in use

#### Check Failed
**Log Level:** ERROR
**Message:** `"Email availability check failed"`
**Data:**
```json
{
  "err": {...},
  "normalizedEmail": "test@example.com",
  "rawEmail": "Test@Example.COM",
  "errorMessage": "Connection timeout"
}
```

---

### POST /api/user/validate-registration

#### Request Received
**Log Level:** INFO
**Message:** `"POST /api/user/validate-registration - validating registration data"`
**Data:**
```json
{
  "email": "test@example.com",
  "hasPassword": true,
  "hasName": true
}
```

#### Email Check During Validation
**Log Level:** INFO
**Message:** `"Email existence check completed during validation"`
**Data:**
```json
{
  "normalizedEmail": "test@example.com",
  "foundCount": 1,
  "foundEmails": ["test@example.com"]
}
```

#### Validation Completed
**Log Level:** INFO
**Message:** `"Registration validation completed"`
**Data:**
```json
{
  "email": "test@example.com",
  "valid": true,
  "errorCount": 0,
  "emailExists": false,
  "foundEmails": [],
  "errors": []
}
```
**Interpretation:**
- `valid: true` → Registration data is good, safe to proceed with signup
- `valid: false` → Registration data has errors
- `errors: ["Email address already in use"]` → Email exists (should return 409 from actual signup)

---

## Database Error Logging

### Database Check Error During Sign-Up
**Log Level:** ERROR
**Message:** `"Error checking email existence in database during sign-up"`
**Data:**
```json
{
  "err": {...},
  "normalizedEmail": "test@example.com",
  "errorMessage": "Connection refused"
}
```
**What this means:**
- Database is unreachable
- Returns 500 Server Error, not 409
- Check database connection and logs

---

## Debugging: Finding False "Already in Use" Errors

### Scenario: New email fails with 409 Conflict

**Step 1:** Find the sign-up request log
```
Look for: "Sign-up request received"
Check: rawEmail and normalizedEmail match the input
```

**Step 2:** Find the database check log
```
Look for: "Email database check completed"
Check: foundCount should be 0 for new email
If foundCount > 0: Email exists, verify in database directly
If foundCount = 0: Email doesn't exist, but still failed
```

**Step 3:** Check the error log
```
Look for: "Auth signup endpoint error"
Check: statusCode and errorMessage
If 409: Email conflict (but we found foundCount = 0)
If 500: Server error (check details)
```

### Scenario: Case-insensitive matching not working

**Step 1:** Register email "test@example.com"
**Step 2:** Try to register "Test@Example.com"

Expected logs:
```
1. "Sign-up request received" with rawEmail: "Test@Example.com"
2. "Email database check completed" with foundCount: 1, foundEmails: ["test@example.com"]
3. "Sign-up attempt with already-existing email"
4. "Auth signup endpoint error" with statusCode: 409
```

If case-insensitive matching isn't working:
- Step 2 would show `foundCount: 0` instead of 1
- This means the database index isn't working
- Run: `SELECT * FROM pg_indexes WHERE indexname = 'user_email_lower_unique'`

---

## Log Examples

### Example 1: Successful New User Registration

```log
[INFO] Sign-up request received
  path: "/api/auth/sign-up/email"
  method: "POST"
  rawEmail: "newuser@example.com"
  normalizedEmail: "newuser@example.com"
  hasPassword: true
  hasName: true

[INFO] Email database check completed
  normalizedEmail: "newuser@example.com"
  foundCount: 0
  foundEmails: []

# No error log means signup succeeded
# Status: 200 OK
```

### Example 2: Duplicate Email Attempt

```log
[INFO] Sign-up request received
  path: "/api/auth/sign-up/email"
  method: "POST"
  rawEmail: "test@example.com"
  normalizedEmail: "test@example.com"
  hasPassword: true
  hasName: true

[INFO] Email database check completed
  normalizedEmail: "test@example.com"
  foundCount: 1
  foundEmails: ["test@example.com"]

[WARN] Sign-up attempt with already-existing email
  normalizedEmail: "test@example.com"
  existingEmails: ["test@example.com"]

[ERROR] Auth signup endpoint error
  path: "/api/auth/sign-up/email"
  method: "POST"
  statusCode: 409
  rawEmail: "test@example.com"
  normalizedEmail: "test@example.com"
  errorMessage: "Email address already in use"
  errorCode: "EMAIL_CONFLICT"

# Status: 409 Conflict
```

### Example 3: Validation Error (Weak Password)

```log
[INFO] POST /api/user/validate-registration - validating registration data
  email: "newuser@example.com"
  hasPassword: true
  hasName: true

[INFO] Email existence check completed during validation
  normalizedEmail: "newuser@example.com"
  foundCount: 0
  foundEmails: []

[INFO] Registration validation completed
  email: "newuser@example.com"
  valid: false
  errorCount: 1
  emailExists: false
  foundEmails: []
  errors: [
    "Password must be at least 8 characters",
    "Password must contain uppercase letter"
  ]

# Frontend shows errors: password too weak
# Response: 200 OK (validation completed, but valid: false)
```

---

## Status Code Mapping

| Status | Meaning | Log to Look For |
|--------|---------|-----------------|
| 200 OK | Success | No error logs, registration proceeds |
| 200 OK | Validation failure | "Registration validation completed" with `valid: false` |
| 400 Bad Request | Invalid input | "Email format validation failed" or "Invalid request" |
| 409 Conflict | Email in use | "Email database check completed" with `foundCount > 0` |
| 500 Server Error | Database error | "Error checking email existence in database" |

---

## Testing with Logs

### Test 1: New Email Should Succeed
```bash
curl -X POST /api/auth/sign-up/email \
  -d '{"email":"newemail123@example.com","password":"Pass123!","name":"User"}'
```
**Expected logs:**
- ✓ "Sign-up request received" with foundCount: 0
- ✓ No "Sign-up attempt with already-existing email"
- ✓ No "Auth signup endpoint error"
- ✓ Status: 200 OK

### Test 2: Existing Email Should Fail
```bash
curl -X POST /api/auth/sign-up/email \
  -d '{"email":"newemail123@example.com","password":"Pass123!","name":"User2"}'
```
**Expected logs:**
- ✓ "Sign-up request received"
- ✓ "Email database check completed" with foundCount: 1
- ✓ "Sign-up attempt with already-existing email"
- ✓ "Auth signup endpoint error" with statusCode: 409
- ✓ Status: 409 Conflict

### Test 3: Case Variant Should Fail (409)
```bash
curl -X POST /api/auth/sign-up/email \
  -d '{"email":"NewEmail123@Example.com","password":"Pass123!","name":"User3"}'
```
**Expected logs:**
- ✓ "Sign-up request received" with rawEmail: "NewEmail123@Example.com" but normalizedEmail: "newemail123@example.com"
- ✓ "Email database check completed" with foundCount: 1
- ✓ "Sign-up attempt with already-existing email"
- ✓ Status: 409 Conflict

---

## Key Debugging Tips

1. **Always check `foundCount`** - This is the true source of truth
   - If `foundCount: 0`, email doesn't exist, so 409 is wrong
   - If `foundCount: 1`, email exists, so 409 is correct

2. **Compare raw vs normalized email** - Verify normalization is happening
   - Should be identical if using ASCII email (letter case difference)
   - If different, something is trimming or cleaning input

3. **Check error message** - Better Auth error tells you the real issue
   - "Email address already in use" = 409 Conflict
   - "Invalid email format" = 400 Bad Request
   - "Password does not meet requirements" = 400 Bad Request

4. **Follow the log flow** - Don't skip steps
   - Request received → Database check → Error (if any)
   - If you see request but no database check, logging may be broken

5. **Database integrity check**
   - `SELECT DISTINCT LOWER(email), COUNT(*) FROM "user" GROUP BY LOWER(email) HAVING COUNT(*) > 1`
   - Should return 0 rows (no duplicates)
   - If it returns rows, there are duplicate emails in database

---

## Summary

With these logs, you can now:
- ✅ See exactly what email is being checked
- ✅ See if normalization is working
- ✅ See what the database returned
- ✅ See the exact HTTP status and error code
- ✅ Debug false "already in use" errors
- ✅ Verify case-insensitive matching works

If registration is still failing for new emails, check the logs for `foundCount`. If it's 0 and you still get 409, the issue is in Better Auth error handling, not email validation.
