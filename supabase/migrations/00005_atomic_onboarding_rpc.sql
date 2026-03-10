-- ============================================================================
-- SwiftReview Pro — Atomic Onboarding RPC + Schema Fixes
-- ============================================================================
-- 1. Adds missing 'growth' value to plan_tier enum.
-- 2. Creates complete_onboarding() RPC that performs all onboarding inserts
--    inside a single transaction. If any step fails, everything rolls back.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Fix: Add 'growth' to plan_tier enum (was missing from initial migration)
-- --------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'growth'
      and enumtypid = 'public.plan_tier'::regtype
  ) then
    alter type public.plan_tier add value 'growth' after 'starter';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- RPC: complete_onboarding
-- --------------------------------------------------------------------------
-- Called from the server action after Zod validation has passed.
-- All 5 inserts succeed or fail atomically. Returns the new org ID.
-- Security: SECURITY DEFINER so it bypasses RLS (server action already
-- validates the user). The function itself checks for duplicate onboarding.
-- --------------------------------------------------------------------------
create or replace function public.complete_onboarding(
  p_user_id             uuid,
  p_business_name       text,
  p_slug                text,
  p_category            text     default null,
  p_website             text     default null,
  p_phone               text     default null,
  p_city                text     default null,
  p_state               text     default null,
  p_timezone            text     default 'America/New_York',
  -- brand settings
  p_tone                text     default 'Professional and friendly',
  p_style_notes         text     default null,
  p_banned_phrases      text[]   default '{}',
  p_signature_line      text     default null,
  p_closing_style       text     default null,
  p_escalation_email    text     default null,
  p_escalation_phone    text     default null,
  p_escalation_wording  text     default null,
  p_allow_offline       boolean  default false,
  -- first location
  p_location_name       text     default 'Main Location',
  p_location_address    text     default null,
  p_location_city       text     default null,
  p_location_state      text     default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- ---- Guard: prevent duplicate onboarding ----
  if exists (
    select 1 from public.organization_members
    where user_id = p_user_id
    limit 1
  ) then
    raise exception 'DUPLICATE_ONBOARDING: User already belongs to an organization.';
  end if;

  -- ---- Guard: slug uniqueness ----
  if exists (
    select 1 from public.organizations where slug = p_slug
  ) then
    raise exception 'SLUG_TAKEN: An organization with a similar name already exists.';
  end if;

  -- ---- 1. Create organization ----
  insert into public.organizations (name, slug, category, website, phone, city, state, timezone)
  values (p_business_name, p_slug, p_category, p_website, p_phone, p_city, p_state, p_timezone)
  returning id into v_org_id;

  -- ---- 2. Add user as owner ----
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  -- ---- 3. Brand settings ----
  insert into public.brand_settings (
    organization_id, tone, style_notes, banned_phrases,
    signature_line, closing_style,
    escalation_email, escalation_phone, escalation_wording,
    allow_offline_resolution
  ) values (
    v_org_id, p_tone, p_style_notes, p_banned_phrases,
    p_signature_line, p_closing_style,
    p_escalation_email, p_escalation_phone, p_escalation_wording,
    p_allow_offline
  );

  -- ---- 4. First location ----
  insert into public.locations (organization_id, name, address, city, state)
  values (v_org_id, p_location_name, p_location_address, p_location_city, p_location_state);

  -- ---- 5. Free-tier subscription ----
  insert into public.subscriptions (organization_id, plan_tier, status, review_limit, reply_limit, location_limit)
  values (v_org_id, 'free', 'active', 50, 20, 1);

  -- ---- 6. Activity log ----
  insert into public.activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (
    v_org_id, p_user_id, 'organization.created', 'organization', v_org_id,
    jsonb_build_object('name', p_business_name, 'source', 'onboarding')
  );

  return v_org_id;
end;
$$;

comment on function public.complete_onboarding is
  'Atomic onboarding: creates org + member + brand_settings + location + subscription in one transaction.';
