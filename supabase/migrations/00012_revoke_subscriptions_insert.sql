-- ============================================================================
-- Migration 00012: Remove unnecessary INSERT grant on subscriptions
-- ============================================================================
-- The INSERT RLS policy on subscriptions was dropped in 00008_security_hardening.
-- However the SQL-level INSERT grant remained. This removes it for defense-in-depth.
-- Subscription creation only happens via complete_onboarding() RPC or Stripe
-- webhook (both use service_role which bypasses grants).
-- ============================================================================

revoke insert on public.subscriptions from authenticated;
