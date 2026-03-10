-- ============================================================================
-- SwiftReview Pro — Security Hardening Migration
-- ============================================================================
-- Addresses all critical, high, and medium vulnerabilities identified in the
-- security audit. Run after 00007_demo_mode.sql.
--
-- Fixes:
--   V1  – Revoke "grant all … to anon" (CRITICAL)
--   V2  – Drop self-add-to-any-org INSERT policy on organization_members (CRITICAL)
--   V3  – Drop open INSERT policy on subscriptions (CRITICAL)
--   V4  – Guard complete_onboarding RPC with auth.uid() check (CRITICAL)
--   V5  – Add SET search_path to is_member_of / is_admin_of (HIGH)
--   V8  – Enable RLS on processed_webhooks (MEDIUM)
--   V15 – (app-side) status transition enforcement in updateReview
--   V18 – Revoke seed_demo_data from anon/authenticated (LOW)
-- ============================================================================

-- ==========================================================================
-- V1 — Revoke dangerous blanket grants
-- ==========================================================================
-- The initial migration granted ALL on everything to anon AND authenticated.
-- We replace with least-privilege grants.
-- ==========================================================================

-- Revoke everything first
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all routines in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from authenticated;
revoke all on all routines in schema public from authenticated;

-- Re-grant schema usage
grant usage on schema public to anon, authenticated;

-- Authenticated role: DML on app tables only
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.brand_settings to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.reply_drafts to authenticated;
grant select, insert         on public.activity_logs to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
-- processed_webhooks: no grant to authenticated — service-role only

-- Sequences: authenticated needs usage for inserts with DEFAULT gen_random_uuid()
grant usage on all sequences in schema public to authenticated;

-- Anon: needs no table access. Supabase Auth routes use the service role
-- internally; anon only needs schema usage for PostgREST introspection.
-- No table grants to anon.

-- Functions: grant only the RLS helpers to authenticated
grant execute on function public.is_member_of(uuid) to authenticated;
grant execute on function public.is_admin_of(uuid) to authenticated;

-- Auth trigger function — only triggered internally, not callable by roles
revoke execute on function public.handle_new_user() from anon, authenticated;
-- Webhook cleanup triggers — service-role only
revoke execute on function public.cleanup_old_webhooks() from anon, authenticated;
revoke execute on function public.maybe_cleanup_webhooks() from anon, authenticated;

-- Default privileges for future tables (safety net)
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage on sequences to authenticated;

-- ==========================================================================
-- V2 — Drop dangerous INSERT policy on organization_members
-- ==========================================================================
-- Old policy: "Users can insert own membership" allowed self-add to ANY org.
-- Onboarding now uses complete_onboarding() RPC (SECURITY DEFINER).
-- ==========================================================================

drop policy if exists "Users can insert own membership" on public.organization_members;

-- ==========================================================================
-- V3 — Drop dangerous INSERT policy on subscriptions
-- ==========================================================================
-- Old policy: "Authenticated can insert subscription" allowed any authenticated
-- user to create an enterprise subscription for any org.
-- Subscription creation is handled by complete_onboarding() and webhooks.
-- ==========================================================================

drop policy if exists "Authenticated can insert subscription" on public.subscriptions;

-- Also tighten the organizations INSERT policy (onboarding RPC handles this)
drop policy if exists "Authenticated users can create organizations" on public.organizations;

-- Also drop the brand_settings self-insert (onboarding RPC handles this)
drop policy if exists "Members can insert brand settings" on public.brand_settings;

-- ==========================================================================
-- V5 — Harden is_member_of / is_admin_of with SET search_path
-- ==========================================================================

create or replace function public.is_member_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$ language sql security definer stable set search_path = public;

create or replace function public.is_admin_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$ language sql security definer stable set search_path = public;

-- ==========================================================================
-- V4 — Guard complete_onboarding with auth.uid() verification
-- ==========================================================================
-- The RPC already has SET search_path. We add an auth.uid() check so
-- callers cannot pass an arbitrary p_user_id.
-- ==========================================================================

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
  -- ---- Guard: caller must be the user being onboarded ----
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'FORBIDDEN: p_user_id must match the authenticated user.';
  end if;

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

-- Revoke direct execution from anon (only authenticated should call this)
revoke execute on function public.complete_onboarding(
  uuid, text, text, text, text, text, text, text, text,
  text, text, text[], text, text, text, text, text, boolean,
  text, text, text, text
) from anon;

-- ==========================================================================
-- V8 — Enable RLS on processed_webhooks
-- ==========================================================================
-- No policies = only service_role (admin client) can access the table.
-- ==========================================================================

alter table public.processed_webhooks enable row level security;

-- ==========================================================================
-- V18 — Revoke seed_demo_data from non-admin roles
-- ==========================================================================
-- The seed RPC should only be callable via the service_role (admin) client.
-- ==========================================================================

revoke execute on function public.seed_demo_data(uuid) from anon, authenticated;

-- ==========================================================================
-- Done — security hardening complete
-- ==========================================================================
