-- ============================================================================
-- SwiftReview Pro — Demo Mode Setup
-- ============================================================================
-- Creates a server-side RPC to seed or reset the demo organization.
-- Called by the /api/demo/seed endpoint or the seed-demo script.
--
-- The demo user must already exist in auth.users before calling this RPC.
-- The RPC is idempotent — it will clean and re-insert data each time.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Demo constants
-- --------------------------------------------------------------------------
-- Demo org ID:  d3m00000-0000-0000-0000-000000000001
-- Demo user ID: must be passed in (from auth.users)
-- --------------------------------------------------------------------------

create or replace function public.seed_demo_data(p_demo_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id    uuid := 'd3m00000-0000-0000-0000-000000000001';
  _loc1_id   uuid := 'd3m01111-1111-1111-1111-111111111111';
  _loc2_id   uuid := 'd3m02222-2222-2222-2222-222222222222';
  _loc3_id   uuid := 'd3m03333-3333-3333-3333-333333333333';
begin
  -- ================================================================
  -- CLEAN existing demo data (idempotent reset)
  -- ================================================================
  delete from public.activity_logs    where organization_id = _org_id;
  delete from public.reply_drafts     where organization_id = _org_id;
  delete from public.reviews          where organization_id = _org_id;
  delete from public.locations        where organization_id = _org_id;
  delete from public.brand_settings   where organization_id = _org_id;
  delete from public.subscriptions    where organization_id = _org_id;
  delete from public.organization_members where organization_id = _org_id;
  delete from public.organizations    where id = _org_id;

  -- Ensure public.users row exists for demo user
  insert into public.users (id, email, full_name, avatar_url)
  values (p_demo_user_id, 'demo@swiftreview.pro', 'Alex Demo', null)
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name;

  -- ================================================================
  -- ORGANIZATION
  -- ================================================================
  insert into public.organizations (id, name, slug, category, website, phone, city, state, timezone)
  values (
    _org_id,
    'Riverside Dental Group',
    'riverside-dental-demo',
    'Healthcare / Dental',
    'https://riverside-dental.example.com',
    '(555) 123-4567',
    'Riverside',
    'CA',
    'America/Los_Angeles'
  );

  -- Owner membership
  insert into public.organization_members (organization_id, user_id, role)
  values (_org_id, p_demo_user_id, 'owner');

  -- ================================================================
  -- SUBSCRIPTION (Growth tier)
  -- ================================================================
  insert into public.subscriptions (
    organization_id, plan_tier, status,
    review_limit, reply_limit, location_limit,
    current_period_start, current_period_end
  ) values (
    _org_id, 'growth', 'active',
    500, 250, 5,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month'
  );

  -- ================================================================
  -- BRAND SETTINGS
  -- ================================================================
  insert into public.brand_settings (
    organization_id, tone, style_notes, banned_phrases,
    signature_line, escalation_wording,
    escalation_email, escalation_phone,
    closing_style, allow_offline_resolution
  ) values (
    _org_id,
    'Professional and friendly',
    'We are a family-friendly dental practice. Emphasize patient comfort, care quality, and modern technology. Keep replies under 100 words.',
    ARRAY['sorry for any inconvenience', 'per our policy', 'unfortunately'],
    '— The Riverside Dental Team',
    'We''d love to discuss this further. Please reach out to us directly so we can make things right.',
    'care@riverside-dental.example.com',
    '(555) 123-4567',
    'warm',
    true
  );

  -- ================================================================
  -- LOCATIONS
  -- ================================================================
  insert into public.locations (id, organization_id, name, address, city, state, zip, phone, google_place_id, is_active) values
    (_loc1_id, _org_id, 'Riverside Downtown',  '123 Main St',     'Riverside', 'CA', '92501', '(555) 123-4567', 'ChIJ_demo_downtown',  true),
    (_loc2_id, _org_id, 'Riverside Eastside',   '456 Oak Ave',     'Riverside', 'CA', '92507', '(555) 234-5678', 'ChIJ_demo_eastside',  true),
    (_loc3_id, _org_id, 'Corona Hills Branch',  '789 Corona Blvd', 'Corona',    'CA', '92881', '(555) 345-6789', null,                  true);

  -- ================================================================
  -- REVIEWS (38 reviews spanning Oct 2025 – Mar 2026)
  -- ================================================================

  -- October 2025
  insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
    (_org_id, _loc1_id, 'Amanda Foster',    5, 'Fantastic experience from start to finish! The staff made me feel so comfortable during my root canal. Cannot recommend enough.', 'Google', 'posted', 'manual', '2025-10-02'),
    (_org_id, _loc2_id, 'Chris Thompson',   4, 'Very professional team at the Eastside location. Appointment ran on time. Only wish they had evening hours.', 'Yelp', 'posted', 'csv_import', '2025-10-08'),
    (_org_id, _loc1_id, 'Jennifer Adams',   3, 'The dental work was good but the front desk seemed disorganized. Had to fill out the same forms twice.', 'Google', 'posted', 'manual', '2025-10-15'),
    (_org_id, _loc2_id, 'Michael Lee',      5, 'Dr. Chen is incredible! Took time to explain everything and was very gentle. My kids love coming here too.', 'Facebook', 'posted', 'manual', '2025-10-22'),
    (_org_id, _loc3_id, 'Karen White',      4, 'Happy to see the new Corona Hills location. Clean, modern, and the staff is fantastic.', 'Google', 'posted', 'manual', '2025-10-28');

  -- November 2025
  insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
    (_org_id, _loc1_id, 'Patricia Nguyen',  4, 'Had my wisdom teeth out here. Recovery instructions were clear and follow-up call was appreciated. Good care.', 'Google', 'posted', 'manual', '2025-11-03'),
    (_org_id, _loc2_id, 'Kevin Martinez',   2, 'Waited an hour with no explanation. When I asked, the receptionist was dismissive. Dental work itself was adequate.', 'Yelp', 'posted', 'manual', '2025-11-10'),
    (_org_id, _loc1_id, 'Susan Clark',      5, 'Best cleaning I''ve ever had! The hygienist was thorough yet gentle. Office is spotless and modern.', 'Google', 'posted', 'csv_import', '2025-11-17'),
    (_org_id, _loc1_id, 'Brian White',      4, 'Solid dental experience. The X-ray results were explained clearly. I appreciate the transparency on costs.', 'TripAdvisor', 'posted', 'manual', '2025-11-22'),
    (_org_id, _loc2_id, 'Rachel Green',     1, 'Terrible billing experience. Charged for services I didn''t receive. Have been trying to get a refund for weeks.', 'Google', 'posted', 'manual', '2025-11-28');

  -- December 2025
  insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
    (_org_id, _loc1_id, 'Andrew Davis',     5, 'Had a dental emergency on a Saturday and they fit me in right away. Grateful for the excellent care.', 'Google', 'posted', 'manual', '2025-12-02'),
    (_org_id, _loc2_id, 'Nicole Harris',    4, 'The new dental scanners are amazing. No more goopy impressions! Technology here is top-notch.', 'Yelp', 'posted', 'csv_import', '2025-12-08'),
    (_org_id, _loc1_id, 'Mark Taylor',      3, 'Pricing seems high compared to other offices in the area. Quality is good but there are cheaper options.', 'Google', 'approved', 'manual', '2025-12-12'),
    (_org_id, _loc1_id, 'Sarah M.',         5, 'Absolutely love this dental office! Dr. Chen is amazing and the staff is so friendly. The new office is beautiful and modern. Highly recommend!', 'Google', 'posted', 'manual', '2025-12-15'),
    (_org_id, _loc1_id, 'James Wilson',     4, 'Great experience overall. Wait time was a bit long but the care was excellent. Will come back.', 'Google', 'approved', 'manual', '2025-12-20');

  -- January 2026
  insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
    (_org_id, _loc2_id, 'Maria Garcia',     5, 'Best dental experience I''ve ever had. They really go above and beyond for their patients. Clean facility, modern equipment.', 'Yelp', 'draft_generated', 'csv_import', '2026-01-05'),
    (_org_id, _loc1_id, 'Olivia Martinez',  5, 'Brought my whole family here and everyone had a great experience. The kids play area is a nice touch!', 'Google', 'draft_generated', 'manual', '2026-01-08'),
    (_org_id, _loc1_id, 'Tom R.',           2, 'Had to wait 45 minutes past my appointment time. Front desk was apologetic but this has happened twice now. The actual dental work was fine.', 'Google', 'needs_attention', 'manual', '2026-01-10'),
    (_org_id, _loc2_id, 'Daniel Brown',     4, 'Really impressed with their Invisalign consultation. Detailed plan, reasonable pricing, and flexible payments.', 'Yelp', 'approved', 'manual', '2026-01-12'),
    (_org_id, _loc2_id, 'Lisa Chen',        1, 'Very disappointing experience. Was charged more than the estimate and nobody explained why. Will not return.', 'Yelp', 'needs_attention', 'manual', '2026-01-18'),
    (_org_id, _loc1_id, 'Ashley Wilson',    2, 'They lost my dental records from my previous transfer. Very frustrating to have to redo everything.', 'Google', 'needs_attention', 'manual', '2026-01-20'),
    (_org_id, _loc2_id, 'Tyler Smith',      5, 'Emergency visit for a cracked tooth — they handled it perfectly. Barely felt the anesthesia.', 'Facebook', 'draft_generated', 'csv_import', '2026-01-25'),
    (_org_id, _loc1_id, 'Hannah Johnson',   3, 'Average experience. Nothing particularly bad but nothing memorable either. The staff was polite.', 'Google', 'new', 'manual', '2026-01-30');

  -- February 2026
  insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
    (_org_id, _loc1_id, 'David Park',       3, 'Decent dental office. Nothing spectacular but nothing bad either. Average wait times and standard service.', 'Facebook', 'new', 'manual', '2026-02-01'),
    (_org_id, _loc1_id, 'Justin Lee',       5, 'Five stars! Got my veneers done and they look absolutely incredible. Dr. Chen is a true artist.', 'Google', 'posted', 'manual', '2026-02-03'),
    (_org_id, _loc2_id, 'Megan Cooper',     4, 'Thorough exam and great recommendations without being pushy about unnecessary procedures.', 'Yelp', 'approved', 'manual', '2026-02-08'),
    (_org_id, _loc2_id, 'Emily Brown',      4, 'Good experience at the Eastside location. The hygienist was thorough and gentle. Parking could be better.', 'Google', 'draft_generated', 'csv_import', '2026-02-10'),
    (_org_id, _loc1_id, 'Ryan Thompson',    1, 'Charged my insurance for procedures that were supposedly included. Very shady billing practices.', 'Google', 'needs_attention', 'manual', '2026-02-14'),
    (_org_id, _loc2_id, 'Stephanie Garcia', 5, 'The sedation dentistry option changed everything for me. Finally found a dentist I''m not afraid of!', 'Facebook', 'draft_generated', 'manual', '2026-02-18'),
    (_org_id, _loc1_id, 'Brandon Kim',      4, 'Great checkup experience. The new equipment is impressive and they were very efficient with time.', 'Google', 'new', 'manual', '2026-02-22'),
    (_org_id, _loc2_id, 'Lauren Adams',     3, 'Good dental work but the office feels cramped. Wish they had more space between chairs for privacy.', 'Yelp', 'new', 'csv_import', '2026-02-26');

  -- March 2026
  insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
    (_org_id, _loc1_id, 'Robert Kim',       5, 'Dr. Chen and crew are the best! Third visit and always a great experience. Keep up the fantastic work!', 'TripAdvisor', 'new', 'manual', '2026-03-01'),
    (_org_id, _loc1_id, 'Nathan Wright',    5, 'Always a pleasure visiting Riverside Downtown. The team remembers your name and genuinely cares.', 'Google', 'new', 'manual', '2026-03-02'),
    (_org_id, _loc2_id, 'Jessica Patel',    4, 'Had my braces consultation today. Very informative and didn''t feel pressured. Looking forward to starting!', 'Google', 'new', 'manual', '2026-03-05'),
    (_org_id, _loc1_id, 'Derek Miller',     2, 'Appointment was running 30 minutes behind and no one communicated it. I had to reschedule other commitments.', 'Yelp', 'new', 'manual', '2026-03-07'),
    (_org_id, _loc2_id, 'Samantha Torres',  5, 'Incredible whitening results! My teeth look amazing and the process was completely painless.', 'Google', 'new', 'manual', '2026-03-08'),
    (_org_id, _loc3_id, 'Victor Huang',     4, 'New Corona Hills branch is great. Easy parking, friendly staff, no wait. Hope they keep it up.', 'Google', 'new', 'manual', '2026-03-09'),
    (_org_id, _loc3_id, 'Diana Ross',       5, 'Love the Corona Hills location! Modern and clean, plus they had availability the same week I called.', 'Yelp', 'new', 'manual', '2026-03-10');

  -- ================================================================
  -- REPLY DRAFTS
  -- ================================================================

  -- Posted drafts (for reviews marked 'posted')
  insert into public.reply_drafts (review_id, organization_id, content, version, is_approved, approved_at, approved_by, posted_at)
  select r.id, _org_id,
    case r.reviewer_name
      when 'Amanda Foster'    then 'Thank you so much, Amanda! We''re delighted you had such a positive experience. Our team works hard to make every procedure as comfortable as possible. We look forward to your next visit! — The Riverside Dental Team'
      when 'Chris Thompson'   then 'Thanks for the kind words, Chris! We''re glad you had a professional experience. We''re actually exploring extended hours — stay tuned! — The Riverside Dental Team'
      when 'Jennifer Adams'   then 'Thank you for your feedback, Jennifer. We apologize for the paperwork confusion — we''ve updated our intake process to prevent this. We appreciate your patience! — The Riverside Dental Team'
      when 'Michael Lee'      then 'What wonderful feedback, Michael! We''re thrilled that both you and your kids enjoy coming to our office. Dr. Chen sends her thanks! See you all soon! — The Riverside Dental Team'
      when 'Karen White'      then 'Thank you, Karen! We''re excited about our new Corona Hills location and glad you''re enjoying it. We look forward to seeing you there! — The Riverside Dental Team'
      when 'Patricia Nguyen'  then 'Thank you, Patricia! We''re glad the wisdom teeth procedure went smoothly and that you found the follow-up helpful. Don''t hesitate to reach out if you have any questions! — The Riverside Dental Team'
      when 'Kevin Martinez'   then 'Kevin, we sincerely apologize for the long wait and the dismissive interaction. That''s not the standard we hold ourselves to. We''d love to make this right — please contact us at (555) 234-5678. — The Riverside Dental Team'
      when 'Susan Clark'      then 'Thank you for the wonderful review, Susan! Our hygienists take great pride in providing gentle yet thorough cleanings. We''re glad you noticed! — The Riverside Dental Team'
      when 'Brian White'      then 'Thanks, Brian! Cost transparency is very important to us. We never want our patients to be surprised. See you at your next appointment! — The Riverside Dental Team'
      when 'Rachel Green'     then 'Rachel, we''re very sorry about the billing issue. This is unacceptable and we want to resolve it immediately. Please call us at (555) 234-5678 so we can review your account. — The Riverside Dental Team'
      when 'Andrew Davis'     then 'We''re so glad we could help during your emergency, Andrew! That''s exactly why we offer Saturday availability. Wishing you a speedy recovery! — The Riverside Dental Team'
      when 'Nicole Harris'    then 'Thanks, Nicole! We''re excited about our new digital scanners too. They make the whole process faster and more comfortable. Glad you enjoyed the experience! — The Riverside Dental Team'
      when 'Sarah M.'         then 'Thank you so much for your kind words, Sarah! We''re thrilled to hear you love our office and had such a positive experience with Dr. Chen. We look forward to seeing you again! — The Riverside Dental Team'
      when 'Justin Lee'       then 'Justin, we''re thrilled with your veneer results! Dr. Chen put special care into your case and we''re so happy you love them. Enjoy that new smile! — The Riverside Dental Team'
      else 'Thank you for your feedback! We truly value it. — The Riverside Dental Team'
    end,
    1, true,
    r.review_date::timestamptz + interval '1 day',
    p_demo_user_id,
    r.review_date::timestamptz + interval '1 day 6 hours'
  from public.reviews r
  where r.organization_id = _org_id
    and r.status = 'posted';

  -- Approved drafts (not yet posted)
  insert into public.reply_drafts (review_id, organization_id, content, version, is_approved, approved_at, approved_by)
  select r.id, _org_id,
    case r.reviewer_name
      when 'Mark Taylor'   then 'Thank you for your honest feedback, Mark. We strive to balance quality with fair pricing. We''d love to discuss our payment plans that can help make care more accessible. — The Riverside Dental Team'
      when 'James Wilson'  then 'Thank you for your review, James! We appreciate your patience and are glad the care met your expectations. We''re actively working to reduce wait times. See you next time! — The Riverside Dental Team'
      when 'Daniel Brown'  then 'Thanks for considering us for your Invisalign journey, Daniel! We''re excited to help you achieve the smile you want. Our team is here for any questions. — The Riverside Dental Team'
      when 'Megan Cooper'  then 'Thank you, Megan! We believe in recommending only what''s truly needed. Your trust means everything to us. — The Riverside Dental Team'
      else 'Thank you for your review! — The Riverside Dental Team'
    end,
    1, true,
    r.review_date::timestamptz + interval '8 hours',
    p_demo_user_id
  from public.reviews r
  where r.organization_id = _org_id
    and r.status = 'approved';

  -- Unapproved drafts (draft_generated status)
  insert into public.reply_drafts (review_id, organization_id, content, version, is_approved)
  select r.id, _org_id,
    case r.reviewer_name
      when 'Maria Garcia'      then 'Maria, thank you so much for this wonderful review! We pride ourselves on providing an exceptional dental experience. Thank you for choosing our Eastside location! — The Riverside Dental Team'
      when 'Olivia Martinez'   then 'What a wonderful review, Olivia! We love seeing entire families and we''re so glad everyone had a great time. The kids'' play area is one of our favorite additions! — The Riverside Dental Team'
      when 'Tyler Smith'       then 'We''re glad we could help with your cracked tooth, Tyler! Our emergency team is always ready. Thank you for trusting us with your care! — The Riverside Dental Team'
      when 'Emily Brown'       then 'Hi Emily, thank you for sharing your experience! We''re glad the hygienist provided thorough and gentle care. We hear you on the parking — we''re exploring options. — The Riverside Dental Team'
      when 'Stephanie Garcia'  then 'Stephanie, we''re so happy that sedation dentistry has made such a difference for you! Everyone deserves comfortable dental care. — The Riverside Dental Team'
      else 'Thank you for your review! — The Riverside Dental Team'
    end,
    1, false
  from public.reviews r
  where r.organization_id = _org_id
    and r.status = 'draft_generated';

  -- ================================================================
  -- ACTIVITY LOGS (realistic timeline)
  -- ================================================================
  insert into public.activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata, created_at) values
    -- Org creation
    (_org_id, p_demo_user_id, 'organization.created',     'organization',   _org_id, '{"name": "Riverside Dental Group", "source": "onboarding"}', '2025-09-28 09:00:00+00'),
    (_org_id, p_demo_user_id, 'location.created',          'location',       _loc1_id, '{"name": "Riverside Downtown"}',    '2025-09-28 09:01:00+00'),
    (_org_id, p_demo_user_id, 'location.created',          'location',       _loc2_id, '{"name": "Riverside Eastside"}',    '2025-09-28 09:02:00+00'),
    (_org_id, p_demo_user_id, 'brand_settings.updated',    'brand_settings', null,     '{"tone": "Professional and friendly"}', '2025-09-28 09:05:00+00'),

    -- October activity
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Amanda Foster", "rating": 5}',    '2025-10-02 12:00:00+00'),
    (_org_id, p_demo_user_id, 'reply.generated',           'reply_draft', null, '{"model": "gpt-4o-mini"}',               '2025-10-02 12:01:00+00'),
    (_org_id, p_demo_user_id, 'reply.approved',            'reply_draft', null, '{}',                                      '2025-10-02 12:05:00+00'),
    (_org_id, p_demo_user_id, 'reply.posted',              'reply_draft', null, '{}',                                      '2025-10-02 12:10:00+00'),

    -- November activity
    (_org_id, p_demo_user_id, 'review.imported',           'review', null, '{"source": "csv_import", "count": 3}',         '2025-11-17 09:00:00+00'),
    (_org_id, p_demo_user_id, 'reply.generated',           'reply_draft', null, '{"model": "gpt-4o-mini"}',               '2025-11-17 09:02:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Rachel Green", "rating": 1}',    '2025-11-28 14:00:00+00'),
    (_org_id, p_demo_user_id, 'review.status_changed',     'review', null, '{"from": "new", "to": "needs_attention"}',     '2025-11-28 14:15:00+00'),

    -- December activity
    (_org_id, p_demo_user_id, 'reply.generated',           'reply_draft', null, '{"model": "gpt-4o-mini"}',               '2025-12-02 14:00:00+00'),
    (_org_id, p_demo_user_id, 'reply.approved',            'reply_draft', null, '{}',                                      '2025-12-02 14:30:00+00'),
    (_org_id, p_demo_user_id, 'reply.posted',              'reply_draft', null, '{}',                                      '2025-12-02 15:00:00+00'),

    -- January activity
    (_org_id, p_demo_user_id, 'review.imported',           'review', null, '{"source": "csv_import", "count": 2}',         '2026-01-05 10:00:00+00'),
    (_org_id, p_demo_user_id, 'reply.generated',           'reply_draft', null, '{"model": "gpt-4o-mini"}',               '2026-01-05 10:02:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Tom R.", "rating": 2}',          '2026-01-10 11:00:00+00'),
    (_org_id, p_demo_user_id, 'review.status_changed',     'review', null, '{"from": "new", "to": "needs_attention"}',     '2026-01-10 11:30:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Lisa Chen", "rating": 1}',       '2026-01-18 09:00:00+00'),

    -- February activity
    (_org_id, p_demo_user_id, 'reply.generated',           'reply_draft', null, '{"model": "gpt-4o-mini"}',               '2026-02-03 10:00:00+00'),
    (_org_id, p_demo_user_id, 'reply.approved',            'reply_draft', null, '{}',                                      '2026-02-03 10:30:00+00'),
    (_org_id, p_demo_user_id, 'reply.posted',              'reply_draft', null, '{}',                                      '2026-02-03 11:00:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Ryan Thompson", "rating": 1}',   '2026-02-14 10:00:00+00'),
    (_org_id, p_demo_user_id, 'review.status_changed',     'review', null, '{"from": "new", "to": "needs_attention"}',     '2026-02-14 10:15:00+00'),
    (_org_id, p_demo_user_id, 'reply.generated',           'reply_draft', null, '{"model": "gpt-4o-mini"}',               '2026-02-18 11:00:00+00'),

    -- March activity (recent)
    (_org_id, p_demo_user_id, 'location.created',          'location', _loc3_id, '{"name": "Corona Hills Branch"}',       '2026-03-01 08:00:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Robert Kim", "rating": 5}',      '2026-03-01 08:30:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Nathan Wright", "rating": 5}',   '2026-03-02 08:30:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Jessica Patel", "rating": 4}',   '2026-03-05 09:00:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Derek Miller", "rating": 2}',    '2026-03-07 10:00:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Samantha Torres", "rating": 5}', '2026-03-08 08:45:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Victor Huang", "rating": 4}',    '2026-03-09 10:00:00+00'),
    (_org_id, p_demo_user_id, 'review.created',            'review', null, '{"reviewer": "Diana Ross", "rating": 5}',      '2026-03-10 09:00:00+00');

end;
$$;

comment on function public.seed_demo_data is
  'Seeds (or resets) the demo organization with reviews, drafts, activity logs, and analytics-ready data. Pass the auth user UUID of the demo account.';
