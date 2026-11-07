# MH Travel — Backend Auth Handoff

## Supabase project

- Project name: `mhtravelmm`
- Project ref: `ewuvxowujkbyvftoihxh`
- Region: `ap-southeast-1`
- Status at setup: `ACTIVE_HEALTHY`

## Applied migrations

### `create_user_profiles_and_auth_policies`

Created `public.profiles` with a foreign key to `auth.users(id)`, unique username support, display name, role, avatar URL, and timestamps. Enabled Row Level Security and added own-profile plus Super Admin policies. Added an `auth.users` insert trigger that creates a profile automatically after signup and derives a username from signup metadata or email when needed.

### `allow_super_admin_role_management`

Updated the role protection trigger so travelers cannot escalate themselves, while a verified Super Admin can change roles through an authorized backend/admin operation.

## Roles

The profile role check currently allows:

- `traveler`
- `super_admin`
- `ads_admin`
- `admin`
- `rental_admin`
- `payment_admin`
- `travel_guide_admin`
- `blog_admin`
- `owner_admin`

Traveler accounts remain distinct from admin and owner accounts. A person who uses MH Travel as a traveler and also manages a business must have a separate owner/admin account.

## Current RLS behavior

A signed-in traveler can read and update their own profile fields. The profile role cannot be changed by a traveler. Super Admin access is checked through the `public.is_super_admin()` security-definer function. Super Admin policies allow management of profiles and roles. The profile table is protected by RLS and is not open for anonymous reads.

## Signup metadata expected by the trigger

The signup request should send metadata similar to:

```json
{
  "username": "aung_aung",
  "display_name": "Aung Aung",
  "avatar_url": "https://..."
}
```

The trigger uses `username` first. For OAuth signups, if a username is not supplied, it derives a safe username from the OAuth profile/email and the app should send the user through a username-completion step before using the account fully.

## Required frontend integration next

The current UI still has a local preview auth provider. Production integration should:

1. use `supabase.auth.signUp` with username/display name metadata;
2. use `supabase.auth.signInWithPassword` for email/Gmail login;
3. add a secure username-login resolver so the browser does not expose private account email addresses;
4. subscribe to `supabase.auth.onAuthStateChange`;
5. load the matching `public.profiles` row after authentication;
6. use the profile role to protect `/super-admin`;
7. use `supabase.auth.signOut()` for both traveler and admin logout.

## OAuth setup still required

Google and Facebook buttons are present in the Signup UI, but they are not production OAuth yet. The owner must configure these providers in Supabase Auth with:

- Google OAuth Client ID and Client Secret;
- Facebook App ID and App Secret;
- production callback URL(s) shown by Supabase;
- local development callback URL if local testing is needed.

No OAuth secrets belong in the Git repository or in frontend source code.

## Account creation note

No real traveler account was inserted because the owner has not yet provided the exact username, Gmail/Email, display name, and temporary password. Once those values are supplied, create the account through Supabase Auth so the profile trigger creates the linked `public.profiles` row automatically. Never insert a fake `auth.users` row directly into the database.
