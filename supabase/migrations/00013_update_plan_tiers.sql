-- ============================================================================
-- Migration 00013: Update plan_tier constraint for MVP pricing
-- ============================================================================
-- Remove 'enterprise' tier and ensure 'growth' is included.
-- New tiers: free, starter, growth, pro
-- ============================================================================

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_tier_check
  CHECK (plan_tier IN ('free', 'starter', 'growth', 'pro'));

-- Migrate any existing enterprise subscriptions to pro
UPDATE public.subscriptions
  SET plan_tier = 'pro'
  WHERE plan_tier = 'enterprise';
