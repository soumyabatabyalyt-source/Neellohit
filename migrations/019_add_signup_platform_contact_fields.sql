-- 019_add_signup_platform_contact_fields.sql
--
-- Lets a signup declare which platforms they want to work on
-- (Reddit is mandatory, Quora/Facebook/Twitter optional) and
-- collects a WhatsApp contact number plus a handle/URL for each
-- selected non-Reddit platform.
--
-- See lib/platforms.ts for the platform enum this must stay in
-- sync with, and lib/validation.ts for the format rules enforced
-- server-side in app/api/signup/route.ts.

alter table public.profiles
  add column if not exists platforms text[] not null default array['reddit'],
  add column if not exists whatsapp text,
  add column if not exists quora text,
  add column if not exists facebook text,
  add column if not exists twitter text;

-- Every selected platform must be one we know about, and Reddit is
-- required on every account regardless of what else was selected.
alter table public.profiles
  drop constraint if exists profiles_platforms_check;

alter table public.profiles
  add constraint profiles_platforms_check
  check (
    platforms <@ array['reddit', 'quora', 'facebook', 'twitter']::text[]
    and 'reddit' = any(platforms)
  );

-- Backfill existing rows (all Reddit-only before this migration).
update public.profiles set platforms = array['reddit'] where platforms is null;
