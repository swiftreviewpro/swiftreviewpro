-- ============================================================================
-- SwiftReview Pro — Add onboarding fields
-- ============================================================================
-- Adds business profile fields to organizations,
-- and escalation/closing fields to brand_settings.
-- ============================================================================

-- organizations: business profile fields
alter table public.organizations
  add column if not exists category     text,
  add column if not exists website      text,
  add column if not exists phone        text,
  add column if not exists city         text,
  add column if not exists state        text,
  add column if not exists timezone     text default 'America/New_York';

-- brand_settings: escalation + closing style
alter table public.brand_settings
  add column if not exists escalation_email           text,
  add column if not exists escalation_phone           text,
  add column if not exists closing_style              text,
  add column if not exists allow_offline_resolution   boolean not null default false;
