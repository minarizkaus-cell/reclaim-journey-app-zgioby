
# Testing Guide for Authentication & Profile Features

## Overview
This guide will help you test all the authentication, email verification, password management, and profile editing features that have been integrated with the backend.

## Backend URL
The app is configured to use: `https://q2hx4dn58vv2vm8cp97dykxef293m4ck.app.specular.dev`

## Test Scenarios

### 1. User Registration (Sign Up)

**Steps:**
1. Open the app
2. On the auth screen, tap "Don't have an account? Register"
3. Fill in the registration form:
   - Display Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `TestPass123` (meets requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, no special chars)
   - Confirm Password: `TestPass123`
4. Tap "Register"

**Expected Results:**
- Registration succeeds
- User is redirected to onboarding screen
- Email verification email is sent (check backend logs)

**Password Validation Tests:**
- Try `test` → Should show error: "Min 8 chars..."
- Try `testpass` → Should show error: "Min 8 chars..." (no uppercase)
- Try `TESTPASS` → Should show error: "Min 8 chars..." (no lowercase)
- Try `TestPass` → Should show error: "Min 8 chars..." (no number)
- Try `TestPass123!` → Should show error: "Min 8 chars..." (special char not allowed)
- Try `Test Pass123` → Should show error: "Min 8 chars..." (space not allowed)
- Try `TestPass123` → Should succeed ✅

### 2. Onboarding Flow

**Steps:**
1. After registration, complete onboarding:
   - **Step 1:** Check "I understand and agree..." → Tap "Continue"
   - **Step 2:** Enter emergency contact:
     - Contact Name: `John Doe`
     - Contact Phone: `0412345678`
     - Tap "Continue"
   - **Step 3:** Personalize:
     - Select timer duration: `15 min`
     - Select sobriety date: Choose a past date (e.g., 30 days ago)
     - Tap "Get Started"

**Expected Results:**
- Profile is saved with emergency contact and sobriety date
- User is redirected to home screen
- Emergency contact appears in "Call Emergency" button functionality

**Sobriety Date Tests:**
- Try selecting a future date → Should show error: "Cannot select a future date"
- Select today's date → Should succeed ✅
- Select a past date → Should succeed ✅

### 3. Email Verification Banner

**Steps:**
1. After registration and onboarding, check the home screen
2. Look for the orange verification banner at the top

**Expected Results:**
- Banner shows: "Verify your email within 24 hours"
- Tapping the banner navigates to verify-email screen
- Banner disappears after email is verified

**24-Hour Expiry Test:**
- If 24+ hours pass without verification, user should be blocked and redirected to verify-email screen on app launch

### 4. Resend Verification Email

**Steps:**
1. Navigate to verify-email screen (tap banner or wait for 24h expiry)
2. Tap "Resend Verification Email"

**Expected Results:**
- Success message: "Verification email sent! Please check your inbox."
- Backend sends verification email (check backend logs)

### 5. User Login (Sign In)

**Steps:**
1. Sign out from settings
2. On auth screen, enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPass123`
3. Tap "Login"

**Expected Results:**
- Login succeeds
- User is redirected to home screen (if onboarded)
- Session persists across app restarts

**Login Error Tests:**
- Wrong password → Should show: "Invalid email or password"
- Non-existent email → Should show: "Invalid email or password"
- Empty fields → Should show inline validation errors

### 6. Session Persistence

**Steps:**
1. Login successfully
2. Close the app completely
3. Reopen the app

**Expected Results:**
- User remains logged in
- No redirect to auth screen
- Home screen loads immediately after splash

### 7. Forgot Password

**Steps:**
1. On login screen, tap "Forgot Password?"
2. Enter email: `testuser@example.com`
3. Tap "Send Reset Link"

**Expected Results:**
- Success message: "If an account with that email exists, a reset link has been sent."
- Modal closes after 3 seconds
- Backend sends password reset email (check backend logs)

### 8. Edit Profile (Emergency Contact & Preferences)

**Steps:**
1. Navigate to Settings → Edit Profile
2. Update emergency contact:
   - Contact Name: `Jane Smith`
   - Contact Phone: `0498765432`
3. Change timer duration to `20 min`
4. Update sobriety date to a different past date
5. Tap "Save Changes"

**Expected Results:**
- Success message: "Profile updated successfully!"
- Changes persist after navigating away and returning
- Emergency contact updates reflect in home screen "Call Emergency" button

### 9. Change Password

**Steps:**
1. Navigate to Settings → Edit Profile
2. Tap "Change Password"
3. Fill in the modal:
   - Current Password: `TestPass123`
   - New Password: `NewPass456`
   - Confirm New Password: `NewPass456`
4. Tap "Change Password"

**Expected Results:**
- Success message: "Password changed successfully!"
- Modal closes after 2 seconds
- Can login with new password after signing out

**Password Change Error Tests:**
- Wrong current password → Should show: "Current password is incorrect"
- New password doesn't meet requirements → Should show inline validation error
- Passwords don't match → Should show: "New passwords do not match"

### 10. Call Emergency Contact

**Steps:**
1. On home screen, tap "Call Emergency" button
2. If emergency contact is set, phone dialer should open
3. If not set, modal should appear prompting to add contact in settings

**Expected Results:**
- With contact set: Phone dialer opens with emergency contact number
- Without contact: Modal shows "No Emergency Contact Set" with option to go to settings

### 11. Social Authentication (Google/Apple)

**Steps:**
1. On auth screen, tap "Continue with Google" or "Continue with Apple"
2. Complete OAuth flow in popup/browser

**Expected Results:**
- OAuth popup opens
- After successful auth, user is redirected to onboarding (if new) or home (if existing)
- Session persists

### 12. Sign Out

**Steps:**
1. Navigate to Settings
2. Tap "Sign Out"
3. Confirm in modal

**Expected Results:**
- User is signed out
- Redirected to auth screen
- Session is cleared (reopening app shows auth screen)

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - User registration with password validation
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile (emergency contact, timer, sobriety date)
- `POST /api/user/change-password` - Change password with validation
- `POST /api/user/send-verification-email` - Resend verification email
- `GET /api/user/verify-email?token=xxx` - Verify email (handled by Better Auth)

## Password Requirements

All password fields (registration, change password) enforce:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- Only letters and numbers (no spaces, no special characters)

**Valid Examples:**
- `TestPass123`
- `MyPassword1`
- `SecurePass99`

**Invalid Examples:**
- `test` (too short, no uppercase, no number)
- `testpass123` (no uppercase)
- `TESTPASS123` (no lowercase)
- `TestPass` (no number)
- `TestPass123!` (special character)
- `Test Pass123` (space)

## Sample Test User

For testing, you can use:
- **Email:** `testuser@example.com`
- **Password:** `TestPass123`
- **Emergency Contact:** John Doe (0412345678)
- **Timer Duration:** 15 minutes
- **Sobriety Date:** 30 days ago

## Troubleshooting

### Login Issues
- Ensure backend is running and accessible
- Check network connectivity
- Verify credentials are correct
- Check backend logs for authentication errors

### Session Not Persisting
- Check that token is being stored in SecureStore (native) or localStorage (web)
- Verify token is being sent in Authorization header
- Check token expiry (should be 7+ days)

### Email Verification Not Working
- Check backend email configuration
- Verify email service is properly set up
- Check spam folder for verification emails

### Password Validation Errors
- Ensure password meets all requirements
- Check for hidden spaces or special characters
- Try copying password to notes app to verify characters

## Notes

- All API calls use Bearer token authentication
- Tokens are stored securely (SecureStore on native, localStorage on web)
- Session is automatically restored on app launch
- Email verification is enforced after 24 hours
- Emergency contact fields replace sponsor fields entirely
- Sobriety date cannot be in the future
