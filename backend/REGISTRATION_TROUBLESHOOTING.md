# Registration Troubleshooting Guide

Quick reference for fixing registration "already in use" errors.

## Problem: New Email Gets "Already in Use" Error

### Step 1: Check the logs

Look for this sequence:
```
1. "Sign-up request received"
2. "Email database check completed"
3. "Auth signup endpoint error"
```

### Step 2: Check `foundCount` value

**If `foundCount: 0`:**
- Email doesn't exist in database
- Problem: Better Auth is returning 409 incorrectly
- Solution: See "False Positive (foundCount = 0)" below

**If `foundCount: 1`:**
- Email exists in database
- Problem: Email really is in use (maybe from test, typo, etc.)
- Solution: Check database or use different email

**If `foundCount: > 1`:**
- Data corruption (duplicate emails)
- Solution: Run deduplication script

---

## False Positive (foundCount = 0)

### Symptom
- New email fails with 409 Conflict
- Logs show `foundCount: 0` (email not found in database)
- But signup still returns 409

### Root Cause
Better Auth or database has a bug, not our validation logic.

### Diagnosis
```sql
-- Verify database is actually empty for this email
SELECT * FROM "user" WHERE LOWER(email) = 'newemail@example.com';
-- Should return 0 rows

-- Verify index exists and works
SELECT * FROM pg_indexes WHERE indexname = 'user_email_lower_unique';
-- Should return 1 row

-- Test the index query directly
SELECT id, email FROM "user" WHERE email = 'newemail@example.com';
-- Should return 0 rows
```

### Fix
1. **Clear any test data:**
   ```sql
   DELETE FROM "user" WHERE LOWER(email) LIKE '%test%';
   ```

2. **Restart the application** to ensure fresh database connections

3. **Try again with a completely unique email:**
   ```bash
   # Use timestamp to guarantee uniqueness
   EMAIL="test-$(date +%s)@example.com"
   curl -X POST /api/auth/sign-up/email \
     -d "{\"email\":\"$EMAIL\",\"password\":\"Pass123!\",\"name\":\"User\"}"
   ```

4. **Check logs:**
   - Should see "Email database check completed" with foundCount: 0
   - Should succeed with 200 OK

---

## Case-Insensitive Matching Not Working

### Symptom
- Register "test@example.com"
- Try to register "Test@Example.com"
- Should fail with 409, but succeeds instead

### Root Cause
Case-insensitive index doesn't exist or isn't being used.

### Diagnosis

**Check 1: Does the index exist?**
```sql
SELECT * FROM pg_indexes
WHERE tablename = 'user' AND indexname = 'user_email_lower_unique';
```
Should return 1 row. If 0 rows:
```
Migration hasn't run
→ Run: npm run db:migrate
```

**Check 2: Are emails normalized in database?**
```sql
SELECT email FROM "user" WHERE email != LOWER(email);
```
Should return 0 rows. If it returns rows:
```
Some emails are still uppercase
→ Run: UPDATE "user" SET "email" = LOWER("email");
```

**Check 3: Is the index query working?**
```sql
-- Create test emails
INSERT INTO "user" (id, email, name, created_at, updated_at)
VALUES ('test1', 'test@example.com', 'Test', now(), now());

-- Try to find with different case
SELECT * FROM "user" WHERE email = 'TEST@EXAMPLE.COM';
-- Should return 0 rows (case-sensitive comparison)

SELECT * FROM "user" WHERE LOWER(email) = 'test@example.com';
-- Should return 1 row (case-insensitive)
```

### Fix

**If index doesn't exist:**
```bash
npm run db:migrate
```

**If emails aren't normalized:**
```sql
UPDATE "user" SET "email" = LOWER("email");
```

**If index exists but not working:**
```sql
-- Drop and recreate the index
DROP INDEX IF EXISTS user_email_lower_unique;
CREATE UNIQUE INDEX user_email_lower_unique ON "user" (LOWER("email"));
```

**Then restart the application:**
```bash
npm run stop
npm run start
```

---

## Error: "Email database check failed"

### Symptom
Logs show: `"Email availability check failed"`

### Root Cause
Database connection issue.

### Check
```log
[ERROR] Email availability check failed
  errorMessage: "Connection refused"
```

### Fix
1. **Verify database is running:**
   ```bash
   # For Neon
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check connection string:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host/dbname
   ```

3. **Restart application:**
   ```bash
   npm run stop
   npm run start
   ```

---

## Error: "Email address already in use" but Email is New

### Most Likely Cause
Someone else already registered it, or you're testing with the same email repeatedly.

### How to Check

**Option 1: Use logs to find existing user**
```
Look for: "Email database check completed" with foundCount: 1
Check: foundEmails: ["test@example.com"]
```

**Option 2: Check database directly**
```sql
SELECT id, email, created_at FROM "user"
WHERE LOWER(email) = 'test@example.com';
```

**Option 3: Use test endpoint**
```bash
curl -X POST /api/user/check-email \
  -d '{"email":"test@example.com"}'
```
Response will show `available: true/false`

### Solution
Use a different email with a timestamp:
```bash
EMAIL="mytest-$(date +%s)@example.com"
curl -X POST /api/auth/sign-up/email \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Pass123!\",\"name\":\"User\"}"
```

---

## HTTP Status Code Wrong

### Symptom
Frontend says: "Got status 400, expected 409 for duplicate email"

### Diagnosis

**Step 1: Which endpoint?**
- `POST /api/auth/sign-up/email` → Better Auth signup (our logging captures this)
- `POST /api/user/validate-registration` → Our validation (returns 200 always with valid: true/false)

**Step 2: Check logs for actual status:**
```
[ERROR] Auth signup endpoint error
  statusCode: 400
  errorMessage: "..."
```

**Step 3: Interpret the status:**

| Status | Meaning |
|--------|---------|
| 200 | Success (signup worked) |
| 400 | Validation error (email format, weak password, etc.) |
| 409 | Email conflict (already in use) |
| 500 | Server error |

**If getting 400 for existing email:**
- Better Auth is treating it as validation error, not conflict
- Check `errorMessage` for actual reason
- Might be password validation, not email

---

## Database Has Duplicate Emails

### Symptom
Can't register, even with unique email

### Check
```sql
SELECT LOWER(email), COUNT(*) as count FROM "user"
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```

If this returns rows, you have duplicates.

### Fix
```sql
-- Identify duplicates
SELECT LOWER(email), array_agg(id), array_agg(email), COUNT(*)
FROM "user"
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- Keep the first, delete duplicates (example, verify first!)
WITH duplicates AS (
  SELECT id, LOWER(email),
         ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY created_at) as rn
  FROM "user"
)
DELETE FROM "user"
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Verify unique constraint works
ALTER TABLE "user" ADD CONSTRAINT user_email_unique UNIQUE (email);
-- Or keep index only (if preferred):
-- CREATE UNIQUE INDEX user_email_lower_unique ON "user" (LOWER("email"));
```

---

## Email Not Being Normalized

### Symptom
Logs show: `"normalizedEmail: Test@Example.com"` (still uppercase)

### Root Cause
`normalizeEmail()` function isn't being called, or being called after database check.

### Check
In logs, look for:
```json
{
  "rawEmail": "Test@Example.com",
  "normalizedEmail": "test@example.com"  // Should be lowercase
}
```

If `normalizedEmail` is NOT lowercase:
1. `normalizeEmail()` isn't working
2. Function is being called after a check

### Fix
1. **Verify utility exists:**
   ```bash
   cat src/utils/auth-utils.ts | grep -A 2 "export function normalizeEmail"
   ```

2. **Check it's being imported:**
   ```bash
   grep "normalizeEmail" src/routes/user.ts src/index.ts
   ```

3. **If not, fix the import:**
   ```typescript
   import { normalizeEmail } from '../utils/auth-utils.js';
   ```

4. **Use it everywhere:**
   ```typescript
   const normalizedEmail = normalizeEmail(body.email || '');
   ```

---

## Quick Debug Checklist

- [ ] Check logs for `foundCount` value
- [ ] Run database queries to verify email doesn't exist
- [ ] Verify index exists: `SELECT * FROM pg_indexes WHERE indexname = 'user_email_lower_unique'`
- [ ] Verify emails are lowercase: `SELECT * FROM "user" WHERE email != LOWER(email)`
- [ ] Check `normalizeEmail()` is being used
- [ ] Verify database is connected
- [ ] Try with unique email: `test-$(date +%s)@example.com`
- [ ] Check actual error message in logs (not just status code)
- [ ] Restart application after schema changes

---

## Getting Help

When reporting an issue, provide:

1. **The logs** (full sequence of INFO/ERROR logs for the signup attempt)
2. **The email being registered**
3. **The HTTP status code returned**
4. **The error message returned**
5. **Database query results:**
   ```sql
   SELECT COUNT(*) FROM "user" WHERE LOWER(email) = 'youremail@example.com';
   ```

Example good issue report:
```
Trying to register: newemail123@example.com
Getting: 409 Conflict - "Email address already in use"

Logs show:
- foundCount: 0 (email not in database)

Database query returns: 0 rows

Expected: 200 OK (new email should register)
Actual: 409 Conflict
```

---

## Summary

| Problem | Check | Fix |
|---------|-------|-----|
| New email gets 409 | `foundCount` in logs | If 0: better auth bug; if 1: email exists |
| Case matching broken | Index exists: `SELECT * FROM pg_indexes` | Create index if missing |
| Validation error | `errorMessage` in logs | Fix format/password |
| DB error | `errorMessage = "Connection..."` | Restart app, check DB |
| Emails not lowercase | `SELECT * FROM "user" WHERE email != LOWER(email)` | Normalize: `UPDATE "user" SET email = LOWER(email)` |
| Duplicates exist | Group by LOWER(email) | Delete duplicates |

Most registration issues can be resolved by:
1. Checking the `foundCount` in logs
2. Verifying the database query
3. Restarting the application
