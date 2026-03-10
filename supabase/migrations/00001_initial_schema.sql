-- ============================================================================
-- SwiftReview Pro — Initial Database Schema
-- ============================================================================
-- Run against a Supabase project (or any PostgreSQL 15+ with uuid-ossp).
-- This migration creates all application tables, indexes, enums, triggers,
-- and Row Level Security policies.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Extensions
-- --------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Custom Enum Types
-- --------------------------------------------------------------------------
create type review_status as enum (
  'new',
  'draft_generated',
  'approved',
  'posted',
  'needs_attention',
  'archived'
);

create type review_source as enum (
  'manual',
  'csv_import',
  'api'
);

create type member_role as enum (
  'owner',
  'admin',
  'member'
);

create type plan_tier as enum (
  'free',
  'starter',
  'pro',
  'enterprise'
);

create type subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused'
);

-- --------------------------------------------------------------------------
-- 1. users (profile mirror of auth.users)
-- --------------------------------------------------------------------------
-- Supabase Auth manages authentication. This table stores app-level profile
-- data and is kept in sync via a trigger on auth.users.
-- --------------------------------------------------------------------------
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.users is 'Application-level user profiles mirroring auth.users';

create index idx_users_email on public.users(email);

-- --------------------------------------------------------------------------
-- 2. organizations
-- --------------------------------------------------------------------------
create table public.organizations (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  logo_url      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.organizations is 'Top-level tenant — all data is scoped to an organization';

create unique index idx_organizations_slug on public.organizations(slug);

-- --------------------------------------------------------------------------
-- 3. organization_members (join table: users ↔ organizations)
-- --------------------------------------------------------------------------
create table public.organization_members (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  role              member_role not null default 'member',
  created_at        timestamptz not null default now(),

  unique (organization_id, user_id)
);

comment on table public.organization_members is 'Maps users to organizations with a role';

create index idx_org_members_user on public.organization_members(user_id);
create index idx_org_members_org  on public.organization_members(organization_id);

-- --------------------------------------------------------------------------
-- 4. locations
-- --------------------------------------------------------------------------
create table public.locations (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,
  address           text,
  city              text,
  state             text,
  zip               text,
  phone             text,
  google_place_id   text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.locations is 'Physical business locations belonging to an organization';

create index idx_locations_org on public.locations(organization_id);
create index idx_locations_google on public.locations(google_place_id) where google_place_id is not null;

-- --------------------------------------------------------------------------
-- 5. brand_settings (one row per org)
-- --------------------------------------------------------------------------
create table public.brand_settings (
  id                        uuid primary key default uuid_generate_v4(),
  organization_id           uuid not null references public.organizations(id) on delete cascade unique,
  tone                      text not null default 'Professional and friendly',
  style_notes               text,
  banned_phrases            text[] not null default '{}',
  signature_line            text,
  escalation_wording        text,
  additional_instructions   text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.brand_settings is 'AI reply generation brand voice configuration per organization';

create unique index idx_brand_settings_org on public.brand_settings(organization_id);

-- --------------------------------------------------------------------------
-- 6. reviews
-- --------------------------------------------------------------------------
create table public.reviews (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  location_id       uuid not null references public.locations(id) on delete cascade,
  reviewer_name     text not null,
  rating            smallint not null check (rating between 1 and 5),
  review_text       text not null,
  platform          text not null,
  status            review_status not null default 'new',
  source            review_source not null default 'manual',
  external_id       text,
  review_date       date not null default current_date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.reviews is 'Customer reviews collected from various platforms';

create index idx_reviews_org        on public.reviews(organization_id);
create index idx_reviews_location   on public.reviews(location_id);
create index idx_reviews_status     on public.reviews(organization_id, status);
create index idx_reviews_date       on public.reviews(organization_id, review_date desc);
create index idx_reviews_rating     on public.reviews(organization_id, rating);
create index idx_reviews_external   on public.reviews(external_id) where external_id is not null;

-- --------------------------------------------------------------------------
-- 7. reply_drafts
-- --------------------------------------------------------------------------
create table public.reply_drafts (
  id                uuid primary key default uuid_generate_v4(),
  review_id         uuid not null references public.reviews(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  content           text not null,
  version           int not null default 1,
  is_approved       boolean not null default false,
  approved_at       timestamptz,
  approved_by       uuid references public.users(id) on delete set null,
  posted_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.reply_drafts is 'AI-generated reply drafts for reviews, versioned';

create index idx_reply_drafts_review on public.reply_drafts(review_id);
create index idx_reply_drafts_org    on public.reply_drafts(organization_id);

-- --------------------------------------------------------------------------
-- 8. activity_logs
-- --------------------------------------------------------------------------
create table public.activity_logs (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  action            text not null,            -- e.g. 'review.created', 'reply.approved'
  entity_type       text not null,            -- e.g. 'review', 'reply_draft', 'location'
  entity_id         uuid,
  metadata          jsonb default '{}',
  created_at        timestamptz not null default now()
);

comment on table public.activity_logs is 'Audit trail of actions within an organization';

create index idx_activity_logs_org      on public.activity_logs(organization_id);
create index idx_activity_logs_user     on public.activity_logs(user_id);
create index idx_activity_logs_created  on public.activity_logs(organization_id, created_at desc);
create index idx_activity_logs_entity   on public.activity_logs(entity_type, entity_id) where entity_id is not null;

-- --------------------------------------------------------------------------
-- 9. subscriptions
-- --------------------------------------------------------------------------
create table public.subscriptions (
  id                        uuid primary key default uuid_generate_v4(),
  organization_id           uuid not null references public.organizations(id) on delete cascade unique,
  stripe_customer_id        text,
  stripe_subscription_id    text,
  plan_tier                 plan_tier not null default 'free',
  status                    subscription_status not null default 'active',
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  review_limit              int not null default 50,
  reply_limit               int not null default 20,
  location_limit            int not null default 1,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.subscriptions is 'Billing / plan information per organization';

create unique index idx_subscriptions_org     on public.subscriptions(organization_id);
create index idx_subscriptions_stripe_cust    on public.subscriptions(stripe_customer_id) where stripe_customer_id is not null;
create index idx_subscriptions_stripe_sub     on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

-- ==========================================================================
-- Triggers: auto-update updated_at
-- ==========================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Apply the trigger to every table with an updated_at column
do $$
declare
  tbl text;
begin
  for tbl in
    select table_name from information_schema.columns
    where table_schema = 'public'
      and column_name = 'updated_at'
      and table_name != 'activity_logs'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.handle_updated_at()',
      tbl
    );
  end loop;
end;
$$;

-- ==========================================================================
-- Trigger: auto-create user profile on auth signup
-- ==========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================================
-- Row Level Security
-- ==========================================================================
-- Principle: users can only read/write rows that belong to the organizations
-- they are members of. We create a helper function to efficiently check
-- membership, then grant policies on each table.
-- ==========================================================================

-- Helper: returns TRUE if the current auth user is a member of the given org
create or replace function public.is_member_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: returns TRUE if the current auth user is owner or admin of the org
create or replace function public.is_admin_of(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$ language sql security definer stable;

-- ---- users ----
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- organizations ----
alter table public.organizations enable row level security;

create policy "Members can read their organization"
  on public.organizations for select
  using (public.is_member_of(id));

create policy "Admins can update their organization"
  on public.organizations for update
  using (public.is_admin_of(id))
  with check (public.is_admin_of(id));

-- Insert is handled server-side (service role) during onboarding
create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() is not null);

-- ---- organization_members ----
alter table public.organization_members enable row level security;

create policy "Members can read memberships in their org"
  on public.organization_members for select
  using (public.is_member_of(organization_id));

create policy "Users can read their own memberships"
  on public.organization_members for select
  using (user_id = auth.uid());

create policy "Admins can manage members"
  on public.organization_members for all
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

-- Allow self-insert during onboarding (user creates their own membership)
create policy "Users can insert own membership"
  on public.organization_members for insert
  with check (user_id = auth.uid());

-- ---- locations ----
alter table public.locations enable row level security;

create policy "Members can read locations"
  on public.locations for select
  using (public.is_member_of(organization_id));

create policy "Admins can manage locations"
  on public.locations for insert
  with check (public.is_admin_of(organization_id));

create policy "Admins can update locations"
  on public.locations for update
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

create policy "Admins can delete locations"
  on public.locations for delete
  using (public.is_admin_of(organization_id));

-- ---- brand_settings ----
alter table public.brand_settings enable row level security;

create policy "Members can read brand settings"
  on public.brand_settings for select
  using (public.is_member_of(organization_id));

create policy "Admins can manage brand settings"
  on public.brand_settings for all
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

-- Allow insert during onboarding
create policy "Members can insert brand settings"
  on public.brand_settings for insert
  with check (public.is_member_of(organization_id));

-- ---- reviews ----
alter table public.reviews enable row level security;

create policy "Members can read reviews"
  on public.reviews for select
  using (public.is_member_of(organization_id));

create policy "Members can insert reviews"
  on public.reviews for insert
  with check (public.is_member_of(organization_id));

create policy "Members can update reviews"
  on public.reviews for update
  using (public.is_member_of(organization_id))
  with check (public.is_member_of(organization_id));

create policy "Admins can delete reviews"
  on public.reviews for delete
  using (public.is_admin_of(organization_id));

-- ---- reply_drafts ----
alter table public.reply_drafts enable row level security;

create policy "Members can read reply drafts"
  on public.reply_drafts for select
  using (public.is_member_of(organization_id));

create policy "Members can insert reply drafts"
  on public.reply_drafts for insert
  with check (public.is_member_of(organization_id));

create policy "Members can update reply drafts"
  on public.reply_drafts for update
  using (public.is_member_of(organization_id))
  with check (public.is_member_of(organization_id));

-- ---- activity_logs ----
alter table public.activity_logs enable row level security;

create policy "Members can read activity logs"
  on public.activity_logs for select
  using (public.is_member_of(organization_id));

create policy "Members can insert activity logs"
  on public.activity_logs for insert
  with check (public.is_member_of(organization_id));

-- ---- subscriptions ----
alter table public.subscriptions enable row level security;

create policy "Members can read subscription"
  on public.subscriptions for select
  using (public.is_member_of(organization_id));

create policy "Admins can update subscription"
  on public.subscriptions for update
  using (public.is_admin_of(organization_id))
  with check (public.is_admin_of(organization_id));

-- Insert handled server-side during org creation
create policy "Authenticated can insert subscription"
  on public.subscriptions for insert
  with check (auth.uid() is not null);

-- ==========================================================================
-- Grant public schema access to authenticated role
-- ==========================================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
