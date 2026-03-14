-- ============================================================================
-- Migration 00011: Add SET search_path to remaining SECURITY DEFINER triggers
-- ============================================================================
-- handle_updated_at() and handle_new_user() were the last two SECURITY DEFINER
-- functions missing a pinned search_path. This closes the final audit gap.
-- ============================================================================

-- 1. handle_updated_at — only references trigger row vars, but pin for correctness
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. handle_new_user — auth trigger, uses qualified public.users already
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
$$ language plpgsql security definer set search_path = public;
