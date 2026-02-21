# Registration Fix - Verification Checklist

Use this checklist to verify the registration fix is working correctly.

---

## ✅ Pre-Deployment Verification

### Code Review
- [ ] `src/utils/auth-utils.ts` exists with 3 functions
  - [ ] `normalizeEmail()` - converts to lowercase
  - [ ] `isValidEmail()` - validates email format
  - [ ] `emailsMatch()` - case-insensitive comparison

- [ ] `src/routes/user.ts` has 3 new endpoints
  - [ ] `POST /api/user/check-email` (simple check)
  - [ ] `POST /api/user/validate-registration` (full validation)
  - [ ] `GET /api/user/registration-test` (diagnostics)

- [ ] `src/index.ts` has error logging
  - [ ] `addHook('onError', ...)` middleware exists
  - [ ] Logs auth signup errors with full details

### Migrations
- [ ] `drizzle/20260221_fix_email_uniqueness.sql` exists
- [ ] `drizzle/meta/_journal.json` updated with migration entry
- [ ] `drizzle/meta/20260221_fix_email_uniqueness_snapshot.json` exists

### Documentation
- [ ] `REGISTRATION_FIX_SUMMARY.md` created
- [ ] `REGISTRATION_TESTING.md` created
- [ ] `REGISTRATION_FIX.md` created
- [ ] `REGISTRATION_FIX_INDEX.md` created

---

## ✅ Post-Deployment Verification

### Database Setup
- [ ] Migrations ran without errors
- [ ] Check index exists:
  ```sql
  SELECT * FROM pg_indexes
  WHERE tablename = 'user' AND indexname = 'user_email_lower_unique';
  ```
  Should return 1 row

- [ ] Check for duplicates:
  ```sql
  SELECT LOWER(email), COUNT(*) FROM "user"
  GROUP BY LOWER(email) HAVING COUNT(*) > 1;
  ```
  Should return 0 rows

- [ ] Check emails normalized:
  ```sql
  SELECT email FROM "user"
  WHERE email != LOWER(email);
  ```
  Should return 0 rows

### API Endpoint Tests

#### 1. Health Check - GET /api/user/registration-test
```bash
curl -X GET http://localhost:3000/api/user/registration-test
```

**Verification:**
- [ ] Status: 200
- [ ] Response has `status: "ok"`
- [ ] `duplicateEmails: []` (empty)
- [ ] `caseInsensitiveDuplicates: []` (empty)
- [ ] All emails in `emails[]` are lowercase

#### 2. Email Check - POST /api/user/check-email
```bash
curl -X POST http://localhost:3000/api/user/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "newtest@example.com"}'
```

**Verification:**
- [ ] Status: 200
- [ ] Response: `{ available: true, email: "newtest@example.com" }`
- [ ] Email normalized to lowercase

#### 3. Validation - POST /api/user/validate-registration
```bash
curl -X POST http://localhost:3000/api/user/validate-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Verification:**
- [ ] Status: 200
- [ ] If all valid: `{ valid: true, errors: [], ... }`
- [ ] If email exists: `{ valid: false, errors: ["Email address already in use"] }`
- [ ] Password checked for strength requirements

---

## ✅ Functional Tests

### Test 1: Register New Email (Should Succeed)

**Step 1:** Get a fresh email address not in database
```bash
TESTEMAIL="unique-$(date +%s)@example.com"
echo "Testing with: $TESTEMAIL"
```

**Step 2:** Check availability
```bash
curl -X POST http://localhost:3000/api/user/check-email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TESTEMAIL\"}"
```
- [ ] Should return `available: true`

**Step 3:** Validate
```bash
curl -X POST http://localhost:3000/api/user/validate-registration \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TESTEMAIL\", \"password\": \"TestPass123!\", \"name\": \"Test User\"}"
```
- [ ] Should return `valid: true`

**Step 4:** Register
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TESTEMAIL\", \"password\": \"TestPass123!\", \"name\": \"Test User\"}"
```
- [ ] Status: 200 OK
- [ ] Response includes `user` object with email
- [ ] Response includes `session` object with token

---

### Test 2: Register Duplicate Email (Should Fail)

**Step 1:** Use email from Test 1
```bash
# Use the TESTEMAIL from previous test
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TESTEMAIL\", \"password\": \"AnotherPass123!\", \"name\": \"Another User\"}"
```
- [ ] Status: 409 Conflict
- [ ] Error message: "Email address already in use"

---

### Test 3: Case-Insensitive Matching (Should Fail)

**Step 1:** Try with different case
```bash
UPPERCASE_EMAIL="${TESTEMAIL^^}"  # Convert to uppercase
curl -X POST http://localhost:3000/api/user/check-email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$UPPERCASE_EMAIL\"}"
```
- [ ] Should return `available: false` (treated as duplicate)
- [ ] Email normalized to lowercase in response

**Step 2:** Attempt registration with different case
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$UPPERCASE_EMAIL\", \"password\": \"TestPass123!\", \"name\": \"Test\"}"
```
- [ ] Status: 409 Conflict
- [ ] Error: "Email address already in use"

---

### Test 4: Invalid Email Format (Should Fail)

**Step 1:** Check invalid email
```bash
curl -X POST http://localhost:3000/api/user/validate-registration \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "TestPass123!", "name": "User"}'
```
- [ ] Status: 200
- [ ] `valid: false`
- [ ] `errors` includes "Invalid email format"

**Step 2:** Attempt registration
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "TestPass123!", "name": "User"}'
```
- [ ] Status: 400 Bad Request
- [ ] Error message about invalid format

---

### Test 5: Weak Password (Should Fail)

**Step 1:** Validate weak password
```bash
curl -X POST http://localhost:3000/api/user/validate-registration \
  -H "Content-Type: application/json" \
  -d '{"email": "weakpass@example.com", "password": "weak", "name": "User"}'
```
- [ ] Status: 200
- [ ] `valid: false`
- [ ] `errors` array includes password requirements

**Step 2:** Attempt registration
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email": "weakpass@example.com", "password": "weak", "name": "User"}'
```
- [ ] Status: 400 Bad Request
- [ ] Error mentions password requirements

---

## ✅ Logging Verification

### Check Application Logs

After running tests, verify logs contain:

#### Successful Registration
```
[INFO] POST /api/user/validate-registration - validating registration data
  email: "unique-xxx@example.com"
  valid: true
  errorCount: 0

[INFO] Auth signup successful
  userId: "user_abc123"
  email: "unique-xxx@example.com"
```

#### Duplicate Email Attempt
```
[WARN] Email validation failed
  email: "unique-xxx@example.com"
  valid: false
  errors: ["Email address already in use"]

[ERROR] Auth signup endpoint error
  path: "/api/auth/sign-up/email"
  statusCode: 409
  errorMessage: "Email address already in use"
  errorCode: "EMAIL_CONFLICT"
```

#### Invalid Format
```
[WARN] Email validation failed
  email: "not-an-email"
  valid: false
  errors: ["Invalid email format"]
```

---

## ✅ Edge Cases

### Test 6: Email with Spaces
```bash
curl -X POST http://localhost:3000/api/user/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "  test@example.com  "}'
```
- [ ] Spaces trimmed automatically
- [ ] Response: `{ available: ..., email: "test@example.com" }`

### Test 7: Mixed Case Input
```bash
curl -X POST http://localhost:3000/api/user/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "Test@EXAMPLE.Com"}'
```
- [ ] Normalized to lowercase
- [ ] Response: `{ ..., email: "test@example.com" }`

### Test 8: Short Name
```bash
curl -X POST http://localhost:3000/api/user/validate-registration \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123!", "name": "A"}'
```
- [ ] Status: 200
- [ ] `valid: false`
- [ ] `errors` includes "Name must be at least 2 characters"

### Test 9: Missing Fields
```bash
curl -X POST http://localhost:3000/api/user/validate-registration \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
- [ ] Should handle gracefully
- [ ] Error about missing fields or invalid data

---

## ✅ Performance & Stability

- [ ] Multiple concurrent registrations don't cause race conditions
- [ ] Database index performs well (unique constraint not slow)
- [ ] No memory leaks during repeated tests
- [ ] Email normalization doesn't impact query performance

---

## ✅ Summary

**Total Checks:** 40+

**Must Pass:** All checks in bold sections
- [ ] Code Review (all files present)
- [ ] Migrations (applied successfully)
- [ ] Database (index exists, no duplicates)
- [ ] All 5 functional tests pass
- [ ] Logs show correct error codes

**Status:**
- [ ] All checks passed - Ready for production
- [ ] Some checks failed - See troubleshooting section
- [ ] Unable to test - Environment not ready

---

## Troubleshooting Failed Tests

### API Returns 500 Error
1. Check application logs for full error
2. Verify migrations ran: `drizzle/20260221_fix_email_uniqueness`
3. Check database connection
4. Verify schema matches code

### Index Not Found
1. Migrations haven't run yet
2. Run migrations: `npm run db:migrate`
3. Verify with: `SELECT * FROM pg_indexes WHERE indexname = 'user_email_lower_unique'`

### Still Getting "Email Already In Use" for New Emails
1. Check database state: `GET /api/user/registration-test`
2. Look for duplicates in the response
3. Check email is actually new with: `SELECT * FROM "user" WHERE LOWER(email) = 'test@example.com'`

### Case Insensitive Matching Not Working
1. Verify index was created: Check PostgreSQL indexes
2. May need to restart application to reload database
3. Try invalidating query cache

### Password Validation Not Working
1. Check `/src/utils/password-validation.ts` exists
2. Verify it's being imported in user routes
3. Test with password: "TestPass123!" (should pass)

---

## Sign-Off

**Tester:** ________________
**Date:** ________________
**Environment:** ________________
**All Tests Passed:** ☐ Yes ☐ No
**Notes:** ________________________________________________________________________
