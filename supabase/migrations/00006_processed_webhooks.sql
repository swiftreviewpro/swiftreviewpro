-- ============================================================================
-- SwiftReview Pro — Webhook Idempotency Table
-- ============================================================================
-- Tracks processed Stripe webhook events to prevent duplicate processing
-- when Stripe retries delivery (up to 3 days, with exponential backoff).
-- ============================================================================

create table if not exists public.processed_webhooks (
  id            uuid        primary key default gen_random_uuid(),
  event_id      text        not null unique,       -- Stripe event ID (evt_xxx)
  event_type    text        not null,              -- e.g. checkout.session.completed
  processed_at  timestamptz not null default now(),
  metadata      jsonb       default '{}'::jsonb    -- optional payload summary
);

-- Index for fast duplicate lookups (unique constraint already creates one,
-- but an explicit btree makes intent clear)
comment on table public.processed_webhooks is
  'Tracks processed Stripe webhook events for idempotency / dedup.';

-- Auto-clean old records (> 30 days) on insert to prevent unbounded growth.
-- Stripe retries for at most 3 days, so 30 days is very generous.
create or replace function public.cleanup_old_webhooks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.processed_webhooks
  where processed_at < now() - interval '30 days';
  return new;
end;
$$;

-- Fire cleanup on every 100th insert (probabilistic via random check)
-- to avoid running a full DELETE on every single webhook.
create or replace function public.maybe_cleanup_webhooks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ~1% chance of cleanup per insert
  if random() < 0.01 then
    delete from public.processed_webhooks
    where processed_at < now() - interval '30 days';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_maybe_cleanup_webhooks on public.processed_webhooks;
create trigger trg_maybe_cleanup_webhooks
  after insert on public.processed_webhooks
  for each row
  execute function public.maybe_cleanup_webhooks();

-- No RLS needed — this table is only accessed by the admin client
-- in the webhook route (service_role key).
