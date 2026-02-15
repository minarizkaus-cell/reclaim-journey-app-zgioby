# Reclaim Journey - Recovery Companion App 🌟

A comprehensive recovery companion app built with Expo 54 and React Native, featuring journal tracking, progress monitoring, and user profile management.

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

---

## 🚀 Backend Integration Status

✅ **COMPLETE** - All backend endpoints are fully integrated!

### Integrated Endpoints:

#### Authentication
- ✅ Email/Password Sign Up & Sign In
- ✅ Google OAuth (Web popup + Native deep linking)
- ✅ Apple OAuth (iOS only)
- ✅ Session management with Bearer tokens

#### User Profile (`/api/user/profile`)
- ✅ GET - Fetch user profile with all fields
- ✅ PUT - Update profile (display_name, timezone, sponsor info, emergency contacts, timer_minutes, sobriety_date, onboarded)

#### Journal Entries (`/api/journal`)
- ✅ GET - Fetch all journal entries for authenticated user
- ✅ POST - Create new journal entry with full data model
- ✅ PUT `/api/journal/:id` - Update existing entry
- ✅ DELETE `/api/journal/:id` - Delete entry

#### Statistics (`/api/journal/stats`)
- ✅ GET - Fetch comprehensive statistics (total entries, outcomes, triggers, tools, average intensity)

---

## 🧪 Testing Guide

### Test User Credentials

**Create a new test account:**
1. Open the app
2. Tap "Sign Up"
3. Enter email: `test@example.com`
4. Enter password: `password123`
5. Optional: Enter name
6. Tap "Sign Up"

### Testing Checklist

#### ✅ Authentication
- [ ] Sign up with email/password
- [ ] Sign out
- [ ] Sign in with existing account
- [ ] Try Google OAuth (Web only)
- [ ] Session persists on app reload

#### ✅ Onboarding
- [ ] New user sees onboarding screens
- [ ] Complete all 4 steps
- [ ] User marked as onboarded
- [ ] Returning user skips onboarding

#### ✅ Profile Management
- [ ] View profile with email
- [ ] Tap "Edit Profile"
- [ ] Update display name
- [ ] Set sobriety date (format: YYYY-MM-DD, e.g., 2024-01-01)
- [ ] Add sponsor information
- [ ] Add emergency contact
- [ ] Save changes
- [ ] Verify "Days Sober" counter appears

#### ✅ Journal Entries
- [ ] Tap "Add Entry" button
- [ ] Select "Yes" for craving
- [ ] Choose triggers (multiple)
- [ ] Set intensity (1-10)
- [ ] Select tools used
- [ ] Choose outcome (resisted/partial/used)
- [ ] Add notes
- [ ] Save entry
- [ ] View entry in list
- [ ] Tap entry to view details
- [ ] Delete entry (with confirmation)

#### ✅ Progress Screen
- [ ] View total entries count
- [ ] See craving count
- [ ] Check average intensity
- [ ] View outcome percentages
- [ ] See common triggers
- [ ] See most used tools
- [ ] Read personalized insight

#### ✅ Data Persistence
- [ ] Create multiple entries
- [ ] Close and reopen app
- [ ] Verify all data persists
- [ ] Pull to refresh on any screen

---

## 📊 Data Models

### User
```typescript
{
  id: string;
  email: string;
  display_name?: string;
  timezone?: string;
  sponsor_name?: string;
  sponsor_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  timer_minutes: number;        // Default: 15
  sobriety_date?: string;       // YYYY-MM-DD
  onboarded: boolean;
}
```

### JournalEntry
```typescript
{
  id: string;
  created_at: string;           // ISO 8601
  had_craving: boolean;
  triggers: string[];
  intensity?: number;           // 1-10, nullable
  tools_used: string[];
  outcome: 'resisted' | 'partial' | 'used';
  notes?: string;
}
```

---

## 📝 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/signin` | Sign in with credentials |
| GET | `/api/user/profile` | Get current user profile |
| PUT | `/api/user/profile` | Update user profile |
| GET | `/api/journal` | Get all journal entries |
| POST | `/api/journal` | Create journal entry |
| PUT | `/api/journal/:id` | Update journal entry |
| DELETE | `/api/journal/:id` | Delete journal entry |
| GET | `/api/journal/stats` | Get statistics |

---

## 🎯 Quick Start

1. **Sign Up**: Create a test account with `test@example.com` / `password123`
2. **Complete Onboarding**: Go through the 4-step introduction
3. **Edit Profile**: Add your display name and sobriety date
4. **Add Journal Entry**: Create your first entry with triggers and outcome
5. **View Progress**: Check the Progress tab to see your statistics

---

**Backend URL**: https://q2hx4dn58vv2vm8cp97dykxef293m4ck.app.specular.dev

**Status**: ✅ All endpoints integrated and tested

Made with 💙 for creativity.
