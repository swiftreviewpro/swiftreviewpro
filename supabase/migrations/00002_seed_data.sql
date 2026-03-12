-- ============================================================================
-- SwiftReview Pro — Seed Data for Local Development
-- ============================================================================
-- Run AFTER the initial schema migration.
-- Creates a demo organization with locations, reviews, and reply drafts.
--
-- NOTE: This seed data assumes you have manually created a test user in
-- Supabase Auth. Replace the UUID below with your auth user's ID:
-- ============================================================================

-- ---- Configuration ----
-- Replace this with the UUID of your Supabase Auth test user.
-- You can create one via the Supabase dashboard or with:
--   supabase auth admin create-user --email dev@swiftreview.local --password devpassword123
do $$
declare
  _user_id   uuid := '00000000-0000-0000-0000-000000000001'; -- placeholder
  _org_id    uuid := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  _loc1_id   uuid := '11111111-1111-1111-1111-111111111111';
  _loc2_id   uuid := '22222222-2222-2222-2222-222222222222';
  _loc3_id   uuid := '33333333-3333-3333-3333-333333333333';
  _review1   uuid := 'aaaa1111-1111-1111-1111-111111111111';
  _review2   uuid := 'aaaa2222-2222-2222-2222-222222222222';
  _review3   uuid := 'aaaa3333-3333-3333-3333-333333333333';
  _review4   uuid := 'aaaa4444-4444-4444-4444-444444444444';
  _review5   uuid := 'aaaa5555-5555-5555-5555-555555555555';
  _review6   uuid := 'aaaa6666-6666-6666-6666-666666666666';
  _review7   uuid := 'aaaa7777-7777-7777-7777-777777777777';
  _review8   uuid := 'aaaa8888-8888-8888-8888-888888888888';
  _draft1    uuid := 'bbbb1111-1111-1111-1111-111111111111';
  _draft2    uuid := 'bbbb2222-2222-2222-2222-222222222222';
  _draft3    uuid := 'bbbb3333-3333-3333-3333-333333333333';
  _draft4    uuid := 'bbbb4444-4444-4444-4444-444444444444';
begin

-- Skip seed data if the placeholder auth user does not exist (e.g. on remote).
-- This migration is for local development only.
if not exists (select 1 from auth.users where id = _user_id) then
  raise notice 'Skipping 00002_seed_data: placeholder user does not exist in auth.users';
  return;
end if;

-- ---- User profile ----
insert into public.users (id, email, full_name, avatar_url)
values (_user_id, 'dev@swiftreview.local', 'Dev User', null)
on conflict (id) do nothing;

-- ---- Organization ----
insert into public.organizations (id, name, slug)
values (_org_id, 'Riverside Dental Group', 'riverside-dental-group')
on conflict (id) do nothing;

-- ---- Organization member (owner) ----
insert into public.organization_members (organization_id, user_id, role)
values (_org_id, _user_id, 'owner')
on conflict (organization_id, user_id) do nothing;

-- ---- Subscription (free tier) ----
insert into public.subscriptions (organization_id, plan_tier, status, review_limit, reply_limit, location_limit)
values (_org_id, 'free', 'active', 50, 20, 1)
on conflict (organization_id) do nothing;

-- ---- Brand Settings ----
insert into public.brand_settings (organization_id, tone, style_notes, banned_phrases, signature_line, escalation_wording)
values (
  _org_id,
  'Professional and friendly',
  'We are a family-friendly dental practice. Emphasize patient comfort and care quality.',
  ARRAY['sorry for any inconvenience', 'per our policy'],
  '— The Riverside Dental Team',
  'We''d love to discuss this further. Please reach out to us directly at (555) 123-4567.'
)
on conflict (organization_id) do nothing;

-- ---- Locations ----
insert into public.locations (id, organization_id, name, address, city, state, zip, phone, google_place_id, is_active) values
  (_loc1_id, _org_id, 'Riverside Downtown',   '123 Main St',      'Riverside', 'CA', '92501', '(555) 123-4567', 'ChIJ_demo_downtown_001',  true),
  (_loc2_id, _org_id, 'Riverside Eastside',    '456 Oak Ave',      'Riverside', 'CA', '92507', '(555) 234-5678', 'ChIJ_demo_eastside_002',  true),
  (_loc3_id, _org_id, 'Corona Hills Branch',   '789 Corona Blvd',  'Corona',    'CA', '92881', '(555) 345-6789', null,                      false)
on conflict (id) do nothing;

-- ---- Reviews ----
insert into public.reviews (id, organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
  -- Positive reviews
  (_review1, _org_id, _loc1_id, 'Sarah M.',       5, 'Absolutely love this dental office! Dr. Chen is amazing and the staff is so friendly. The new office is beautiful and modern. Highly recommend!', 'Google',      'posted',          'manual',     '2025-12-15'),
  (_review2, _org_id, _loc1_id, 'James Wilson',   4, 'Great experience overall. Wait time was a bit long but the care was excellent. Will come back.', 'Google',      'approved',        'manual',     '2025-12-20'),
  (_review3, _org_id, _loc2_id, 'Maria Garcia',   5, 'Best dental experience I''ve ever had. They really go above and beyond for their patients. Clean facility, modern equipment.', 'Yelp',        'draft_generated', 'csv_import', '2026-01-05'),
  -- Negative reviews
  (_review4, _org_id, _loc1_id, 'Tom R.',         2, 'Had to wait 45 minutes past my appointment time. Front desk was apologetic but this has happened twice now. The actual dental work was fine.', 'Google',      'needs_attention', 'manual',     '2026-01-10'),
  (_review5, _org_id, _loc2_id, 'Lisa Chen',      1, 'Very disappointing experience. Was charged more than the estimate and nobody explained why. Will not return.', 'Yelp',        'new',             'manual',     '2026-01-18'),
  -- Mixed reviews
  (_review6, _org_id, _loc1_id, 'David Park',     3, 'Decent dental office. Nothing spectacular but nothing bad either. Average wait times and standard service.', 'Facebook',    'new',             'manual',     '2026-02-01'),
  (_review7, _org_id, _loc2_id, 'Emily Brown',    4, 'Good experience at the Eastside location. The hygienist was thorough and gentle. Parking could be better.', 'Google',      'draft_generated', 'csv_import', '2026-02-10'),
  (_review8, _org_id, _loc1_id, 'Robert Kim',     5, 'Dr. Chen and crew are the best! Third visit and always a great experience. Keep up the fantastic work!', 'TripAdvisor', 'new',             'manual',     '2026-03-01')
on conflict (id) do nothing;

-- ---- Reply Drafts ----
insert into public.reply_drafts (id, review_id, organization_id, content, version, is_approved, approved_at, approved_by, posted_at) values
  -- Posted reply for review 1
  (_draft1, _review1, _org_id,
   'Thank you so much for your kind words, Sarah! We''re thrilled to hear you love our office and had such a positive experience with Dr. Chen. Our team works hard to create a welcoming environment, and it means the world when patients notice. We look forward to seeing you at your next visit! — The Riverside Dental Team',
   1, true, '2025-12-16 10:00:00+00', _user_id, '2025-12-16 10:30:00+00'),
  -- Approved reply for review 2
  (_draft2, _review2, _org_id,
   'Thank you for your review, James! We appreciate your patience and are glad the care met your expectations. We''re actively working to reduce wait times — your feedback helps us improve. See you next time! — The Riverside Dental Team',
   1, true, '2025-12-21 09:00:00+00', _user_id, null),
  -- Draft for review 3
  (_draft3, _review3, _org_id,
   'Maria, thank you so much for this wonderful review! We pride ourselves on providing an exceptional dental experience and it''s great to know we delivered. Thank you for choosing our Eastside location! — The Riverside Dental Team',
   1, false, null, null, null),
  -- Draft for review 7
  (_draft4, _review7, _org_id,
   'Hi Emily, thank you for sharing your experience! We''re glad the hygienist provided thorough and gentle care. We hear you on the parking situation — we''re actually exploring options to improve that. Thanks for being a patient of ours! — The Riverside Dental Team',
   1, false, null, null, null)
on conflict (id) do nothing;

-- ---- Activity Logs ----
insert into public.activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata) values
  (_org_id, _user_id, 'organization.created',   'organization',  _org_id,   '{"name": "Riverside Dental Group"}'),
  (_org_id, _user_id, 'location.created',        'location',      _loc1_id,  '{"name": "Riverside Downtown"}'),
  (_org_id, _user_id, 'location.created',        'location',      _loc2_id,  '{"name": "Riverside Eastside"}'),
  (_org_id, _user_id, 'review.created',           'review',        _review1,  '{"reviewer": "Sarah M.", "rating": 5}'),
  (_org_id, _user_id, 'reply.generated',          'reply_draft',   _draft1,   '{"review_id": "aaaa1111-1111-1111-1111-111111111111"}'),
  (_org_id, _user_id, 'reply.approved',           'reply_draft',   _draft1,   '{}'),
  (_org_id, _user_id, 'reply.posted',             'reply_draft',   _draft1,   '{}'),
  (_org_id, _user_id, 'review.imported',          'review',        _review3,  '{"source": "csv_import", "count": 2}'),
  (_org_id, _user_id, 'brand_settings.updated',   'brand_settings', null,     '{"tone": "Professional and friendly"}');

end;
$$;

-- ============================================================================
-- Verify seed data
-- ============================================================================
-- select count(*) as users          from public.users;
-- select count(*) as organizations  from public.organizations;
-- select count(*) as members        from public.organization_members;
-- select count(*) as locations      from public.locations;
-- select count(*) as reviews        from public.reviews;
-- select count(*) as reply_drafts   from public.reply_drafts;
-- select count(*) as activity_logs  from public.activity_logs;
-- select count(*) as subscriptions  from public.subscriptions;
