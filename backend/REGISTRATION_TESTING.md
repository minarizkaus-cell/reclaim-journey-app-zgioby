# Registration Flow - Testing Quick Reference

## Setup

After deploying, migrations will run automatically and:
1. Drop case-sensitive email constraint
2. Create case-insensitive unique index: `user_email_lower_unique`
3. Normalize all existing emails to lowercase

## API Endpoints for Testing

### 1. Check Database Health
```bash
curl -X GET "http://localhost:3000/api/user/registration-test" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": "ok",
  "totalUsers": 2,
  "emails": ["test@example.com", "user@example.com"],
  "duplicateEmails": [],
  "caseInsensitiveDuplicates": [],
  "timestamp": "2026-02-21T10:30:00.000Z"
}
```

**What to check:**
- ✓ `duplicateEmails` is empty (no exact duplicates)
- ✓ `caseInsensitiveDuplicates` is empty (no case variants)
- ✓ All emails in the `emails` array are lowercase

---

### 2. Check Email Availability
```bash
curl -X POST "http://localhost:3000/api/user/check-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com"}'
```

**Response - Available:**
```json
{
  "available": true,
  "email": "newuser@example.com"
}
```

**Response - Already Taken:**
```json
{
  "available": false,
  "email": "test@example.com"
}
```

**Note:** Emails are normalized to lowercase automatically

---

### 3. Validate Registration Data
```bash
curl -X POST "http://localhost:3000/api/user/validate-registration" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

**Response - Valid:**
```json
{
  "valid": true,
  "errors": [],
  "email": "newuser@example.com",
  "suggestions": "Registration data is valid. Ready to proceed."
}
```

**Response - Invalid:**
```json
{
  "valid": false,
  "errors": [
    "Email address already in use",
    "Password must contain uppercase, lowercase, numbers, and special characters"
  ],
  "email": "existing@example.com",
  "suggestions": "Please fix the errors above before attempting to register"
}
```

**Checks performed:**
- ✓ Email format (must be valid email)
- ✓ Email availability (must not exist in database)
- ✓ Name length (minimum 2 characters)
- ✓ Password strength (uppercase, lowercase, number, special char, min 8 chars)

---

### 4. Actual Registration (Better Auth)
```bash
curl -X POST "http://localhost:3000/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

**Response - Success (200):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "newuser@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "session_token_here",
    "expiresAt": "2026-02-28T10:30:00.000Z"
  }
}
```

**Response - Email Already Used (409):**
```json
{
  "error": "Email address already in use"
}
```

**Response - Invalid Data (400):**
```json
{
  "error": "Invalid request data"
}
```

---

## Test Scenarios

### Scenario 1: Register New User (Expected to Pass)

**Step 1:** Check availability
```bash
curl -X POST "http://localhost:3000/api/user/check-email" \
  -d '{"email": "alice@example.com"}'
# Response: { "available": true, "email": "alice@example.com" }
```

**Step 2:** Validate registration
```bash
curl -X POST "http://localhost:3000/api/user/validate-registration" \
  -d '{
    "email": "alice@example.com",
    "password": "AlicePass123!",
    "name": "Alice"
  }'
# Response: { "valid": true, "errors": [], ... }
```

**Step 3:** Register
```bash
curl -X POST "http://localhost:3000/api/auth/sign-up/email" \
  -d '{
    "email": "alice@example.com",
    "password": "AlicePass123!",
    "name": "Alice"
  }'
# Response: 200 OK { "user": {...}, "session": {...} }
```

---

### Scenario 2: Register with Existing Email (Expected to Fail)

**Step 1:** Check availability
```bash
curl -X POST "http://localhost:3000/api/user/check-email" \
  -d '{"email": "alice@example.com"}'
# Response: { "available": false, "email": "alice@example.com" }
```

**Step 2:** Validate registration
```bash
curl -X POST "http://localhost:3000/api/user/validate-registration" \
  -d '{
    "email": "alice@example.com",
    "password": "AnotherPass123!",
    "name": "Alice2"
  }'
# Response: { "valid": false, "errors": ["Email address already in use"], ... }
```

**Step 3:** Don't attempt signup (validation failed)

---

### Scenario 3: Case-Insensitive Matching (Expected to Fail)

If "alice@example.com" exists:

**Step 1:** Try with different case
```bash
curl -X POST "http://localhost:3000/api/user/check-email" \
  -d '{"email": "Alice@Example.com"}'
# Response: { "available": false, "email": "alice@example.com" }
# NOTE: Email normalized to lowercase!
```

**Step 2:** Validation will fail
```bash
curl -X POST "http://localhost:3000/api/user/validate-registration" \
  -d '{
    "email": "Alice@Example.com",
    "password": "Pass123!",
    "name": "Alice"
  }'
# Response: { "valid": false, "errors": ["Email address already in use"], ... }
```

---

### Scenario 4: Invalid Password (Expected to Fail)

```bash
curl -X POST "http://localhost:3000/api/user/validate-registration" \
  -d '{
    "email": "newuser@example.com",
    "password": "weak",
    "name": "User"
  }'
```

**Response:**
```json
{
  "valid": false,
  "errors": [
    "Password must be at least 8 characters",
    "Password must contain an uppercase letter",
    "Password must contain a lowercase letter",
    "Password must contain a number",
    "Password must contain a special character (!@#$%^&*)"
  ],
  "email": "newuser@example.com",
  "suggestions": "Please fix the errors above before attempting to register"
}
```

---

### Scenario 5: Invalid Email (Expected to Fail)

```bash
curl -X POST "http://localhost:3000/api/user/validate-registration" \
  -d '{
    "email": "not-an-email",
    "password": "ValidPass123!",
    "name": "User"
  }'
```

**Response:**
```json
{
  "valid": false,
  "errors": [
    "Invalid email format"
  ],
  "email": "not-an-email",
  "suggestions": "Please fix the errors above before attempting to register"
}
```

---

## Logging

After changes, all auth signup attempts are logged with full details:

```
[INFO] POST /api/user/check-email - checking email availability
  email: "newuser@example.com"
  available: true

[INFO] POST /api/user/validate-registration - validating registration data
  email: "newuser@example.com"
  valid: true
  errorCount: 0

[INFO] Auth signup successful
  userId: "user_abc123"
  email: "newuser@example.com"

OR

[ERROR] Auth signup endpoint error
  path: "/api/auth/sign-up/email"
  statusCode: 409
  errorMessage: "Email address already in use"
  errorCode: "EMAIL_CONFLICT"
```

---

## Database Verification

To manually verify the database state:

```sql
-- Check the unique index
SELECT * FROM pg_indexes
WHERE tablename = 'user' AND indexname = 'user_email_lower_unique';

-- Should return one row with the unique index on LOWER(email)

-- Check for duplicates (case-insensitive)
SELECT LOWER(email), COUNT(*) as count FROM "user"
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Should return empty (no duplicates)

-- Check all emails are lowercase
SELECT email FROM "user"
WHERE email != LOWER(email);

-- Should return empty (all normalized)
```

---

## Summary

| Test | Expected | Command |
|------|----------|---------|
| New email available | 200 OK | `POST /api/user/check-email` |
| New email validates | valid:true | `POST /api/user/validate-registration` |
| New email registers | 200 OK | `POST /api/auth/sign-up/email` |
| Existing email unavailable | 409 Conflict | `POST /api/auth/sign-up/email` |
| Case variant unavailable | 409 Conflict | `POST /api/auth/sign-up/email` |
| Invalid email fails | valid:false | `POST /api/user/validate-registration` |
| Weak password fails | valid:false | `POST /api/user/validate-registration` |
| DB has no duplicates | duplicateEmails:[] | `GET /api/user/registration-test` |

---

## Troubleshooting

**Issue:** Registration still failing for new email
- [ ] Check `/api/user/registration-test` for duplicates
- [ ] Check logs for actual error message (not just "email exists")
- [ ] Verify migration `20260221_fix_email_uniqueness` has run

**Issue:** Case variants being treated as different
- [ ] Migration hasn't run yet
- [ ] Or database rollback occurred
- [ ] Check that `user_email_lower_unique` index exists

**Issue:** Old emails not normalized
- [ ] Check `/api/user/registration-test` `emails` array
- [ ] All should be lowercase
- [ ] Run migration again if needed

**Issue:** Still seeing "email already in use" errors in logs**
- [ ] This is expected if email actually exists
- [ ] Check `/api/user/registration-test` to confirm
- [ ] Or look at logs for exact error code
