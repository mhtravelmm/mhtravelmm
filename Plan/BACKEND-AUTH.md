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

The Plan folder intentionally stores only this implementation record, not the SQL source. The SQL was applied directly to the Supabase project through the two migrations above.

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

The UI now uses Supabase directly whenever the Supabase environment is configured. Admin Login does not fall back to the local preview account in that mode. The connected project must contain a real Supabase Auth user with a linked `public.profiles` row whose role is `super_admin`.

Current frontend integration:

1. `supabase.auth.signUp` now sends username/display name metadata;
2. `supabase.auth.signInWithPassword` now handles configured email/Gmail login;
3. a secure username-login resolver is still needed so the browser does not expose private account email addresses;
4. `supabase.auth.onAuthStateChange` now hydrates the shared app session;
5. the matching `public.profiles` row is loaded after authentication;
6. the profile role protects `/super-admin`;
7. `supabase.auth.signOut()` is used for both traveler and admin logout;
8. Google and Facebook buttons now call `supabase.auth.signInWithOAuth` with the Login callback route.
9. Admin Login calls `supabase.auth.signInWithPassword`, verifies the linked profile role, and rejects accounts without `super_admin`.

## OAuth setup still required

Google and Facebook buttons are present in the Signup UI, but they are not production OAuth yet. The owner must configure these providers in Supabase Auth with:

- Google OAuth Client ID and Client Secret;
- Facebook App ID and App Secret;
- production callback URL(s) shown by Supabase;
- local development callback URL if local testing is needed.

No OAuth secrets belong in the Git repository or in frontend source code.

Facebook App credentials were provided during setup, but they were not entered because Supabase Dashboard login required a manual hCaptcha step. Provider configuration is deferred until the owner resumes the dashboard login. The supplied secret is intentionally not recorded here.

## Account creation note

The first Supabase Auth account was created through the Dashboard and its linked profile was promoted to `super_admin` through a one-time SQL role update. The account email still needs to be confirmed in Supabase Auth before password login can succeed if email confirmation is enabled. Never insert a fake `auth.users` row directly into the database.
