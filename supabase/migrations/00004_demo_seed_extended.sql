-- ============================================================================
-- SwiftReview Pro — Extended Demo Seed Data
-- ============================================================================
-- Run AFTER 00002_seed_data.sql to add more realistic data for demos.
-- Adds ~30 additional reviews spanning 6 months, more drafts, and activity.
-- ============================================================================

do $$
declare
  _user_id   uuid := '00000000-0000-0000-0000-000000000001';
  _org_id    uuid := 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  _loc1_id   uuid := '11111111-1111-1111-1111-111111111111';
  _loc2_id   uuid := '22222222-2222-2222-2222-222222222222';
begin

-- Skip on remote if the dev placeholder org does not exist.
-- This migration is for local development only.
if not exists (select 1 from public.organizations where id = _org_id) then
  raise notice 'Skipping 00004_demo_seed_extended: dev org does not exist';
  return;
end if;

-- ---- Additional reviews for rich analytics ----

-- October 2025
insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
  (_org_id, _loc1_id, 'Amanda Foster',    5, 'Fantastic experience from start to finish! The staff made me feel so comfortable during my root canal. Cannot recommend enough.', 'Google', 'posted', 'manual', '2025-10-02'),
  (_org_id, _loc2_id, 'Chris Thompson',   4, 'Very professional team at the Eastside location. Appointment ran on time. Only wish they had evening hours.', 'Yelp', 'posted', 'csv_import', '2025-10-08'),
  (_org_id, _loc1_id, 'Jennifer Adams',   3, 'The dental work was good but the front desk seemed disorganized. Had to fill out the same forms twice.', 'Google', 'posted', 'manual', '2025-10-15'),
  (_org_id, _loc2_id, 'Michael Lee',      5, 'Dr. Chen is incredible! Took time to explain everything and was very gentle. My kids love coming here too.', 'Facebook', 'posted', 'manual', '2025-10-22');

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
  (_org_id, _loc1_id, 'Mark Taylor',      3, 'Pricing seems high compared to other offices in the area. Quality is good but there are cheaper options.', 'Google', 'approved', 'manual', '2025-12-12');

-- January 2026
insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
  (_org_id, _loc1_id, 'Olivia Martinez',  5, 'Brought my whole family here and everyone had a great experience. The kids play area is a nice touch!', 'Google', 'draft_generated', 'manual', '2026-01-08'),
  (_org_id, _loc2_id, 'Daniel Brown',     4, 'Really impressed with their Invisalign consultation. Detailed plan, reasonable pricing, and flexible payments.', 'Yelp', 'approved', 'manual', '2026-01-12'),
  (_org_id, _loc1_id, 'Ashley Wilson',    2, 'They lost my dental records from my previous transfer. Very frustrating to have to redo everything.', 'Google', 'needs_attention', 'manual', '2026-01-20'),
  (_org_id, _loc2_id, 'Tyler Smith',      5, 'Emergency visit for a cracked tooth — they handled it perfectly. Barely felt the anesthesia.', 'Facebook', 'draft_generated', 'csv_import', '2026-01-25'),
  (_org_id, _loc1_id, 'Hannah Johnson',   3, 'Average experience. Nothing particularly bad but nothing memorable either. The staff was polite.', 'Google', 'new', 'manual', '2026-01-30');

-- February 2026
insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
  (_org_id, _loc1_id, 'Justin Lee',       5, 'Five stars! Got my veneers done and they look absolutely incredible. Dr. Chen is a true artist.', 'Google', 'posted', 'manual', '2026-02-03'),
  (_org_id, _loc2_id, 'Megan Cooper',     4, 'Thorough exam and great recommendations without being pushy about unnecessary procedures.', 'Yelp', 'approved', 'manual', '2026-02-08'),
  (_org_id, _loc1_id, 'Ryan Thompson',    1, 'Charged my insurance for procedures that were supposedly included. Very shady billing practices.', 'Google', 'needs_attention', 'manual', '2026-02-14'),
  (_org_id, _loc2_id, 'Stephanie Garcia', 5, 'The sedation dentistry option changed everything for me. Finally found a dentist I''m not afraid of!', 'Facebook', 'draft_generated', 'manual', '2026-02-18'),
  (_org_id, _loc1_id, 'Brandon Kim',      4, 'Great checkup experience. The new equipment is impressive and they were very efficient with time.', 'Google', 'new', 'manual', '2026-02-22'),
  (_org_id, _loc2_id, 'Lauren Adams',     3, 'Good dental work but the office feels cramped. Wish they had more space between chairs for privacy.', 'Yelp', 'new', 'csv_import', '2026-02-26');

-- March 2026
insert into public.reviews (organization_id, location_id, reviewer_name, rating, review_text, platform, status, source, review_date) values
  (_org_id, _loc1_id, 'Nathan Wright',    5, 'Always a pleasure visiting Riverside Downtown. The team remembers your name and genuinely cares.', 'Google', 'new', 'manual', '2026-03-02'),
  (_org_id, _loc2_id, 'Jessica Patel',    4, 'Had my braces consultation today. Very informative and didn''t feel pressured. Looking forward to starting!', 'Google', 'new', 'manual', '2026-03-05'),
  (_org_id, _loc1_id, 'Derek Miller',     2, 'Appointment was running 30 minutes behind and no one communicated it. I had to reschedule other commitments.', 'Yelp', 'new', 'manual', '2026-03-07'),
  (_org_id, _loc2_id, 'Samantha Torres',  5, 'Incredible whitening results! My teeth look amazing and the process was completely painless.', 'Google', 'new', 'manual', '2026-03-08');

-- ---- Reply drafts for some of the new reviews ----

-- Posted drafts for October-December reviews
insert into public.reply_drafts (review_id, organization_id, content, version, is_approved, approved_at, approved_by, posted_at)
select r.id, _org_id,
  case r.reviewer_name
    when 'Amanda Foster' then 'Thank you so much, Amanda! We''re delighted you had such a positive experience. Our team works hard to make every procedure as comfortable as possible. We look forward to your next visit! — The Riverside Dental Team'
    when 'Chris Thompson' then 'Thanks for the kind words, Chris! We''re glad you had a professional experience. We''re actually exploring extended hours — stay tuned! — The Riverside Dental Team'
    when 'Jennifer Adams' then 'Thank you for your feedback, Jennifer. We apologize for the paperwork confusion — we''ve updated our intake process to prevent this. We appreciate your patience! — The Riverside Dental Team'
    when 'Michael Lee' then 'What wonderful feedback, Michael! We''re thrilled that both you and your kids enjoy coming to our office. Dr. Chen sends her thanks! See you all soon! — The Riverside Dental Team'
    when 'Patricia Nguyen' then 'Thank you, Patricia! We''re glad the wisdom teeth procedure went smoothly and that you found the follow-up helpful. Don''t hesitate to reach out if you have any questions during recovery! — The Riverside Dental Team'
    when 'Kevin Martinez' then 'Kevin, we sincerely apologize for the long wait and the dismissive interaction. That''s not the standard we hold ourselves to. We''d love to make this right — please contact us at (555) 234-5678. — The Riverside Dental Team'
    when 'Susan Clark' then 'Thank you for the wonderful review, Susan! Our hygienists take great pride in providing gentle yet thorough cleanings. We''re glad you noticed! — The Riverside Dental Team'
    when 'Brian White' then 'Thanks, Brian! Cost transparency is very important to us. We never want our patients to be surprised. See you at your next appointment! — The Riverside Dental Team'
    when 'Rachel Green' then 'Rachel, we''re very sorry about the billing issue. This is unacceptable and we want to resolve it immediately. Please call us at (555) 234-5678 so we can review your account and issue any necessary corrections. — The Riverside Dental Team'
    when 'Andrew Davis' then 'We''re so glad we could help during your emergency, Andrew! That''s exactly why we offer Saturday availability. Wishing you a speedy recovery! — The Riverside Dental Team'
    when 'Nicole Harris' then 'Thanks, Nicole! We''re excited about our new digital scanners too. They make the whole process faster and more comfortable. Glad you enjoyed the experience! — The Riverside Dental Team'
    when 'Justin Lee' then 'Justin, we''re thrilled with your veneer results! Dr. Chen put special care into your case and we''re so happy you love them. Enjoy that new smile! — The Riverside Dental Team'
    else 'Thank you for your feedback! We truly value your input and are always looking for ways to improve. — The Riverside Dental Team'
  end,
  1, true, now() - interval '1 day', _user_id,
  case when r.status = 'posted' then now() - interval '12 hours' else null end
from public.reviews r
where r.organization_id = _org_id
  and r.reviewer_name in ('Amanda Foster', 'Chris Thompson', 'Jennifer Adams', 'Michael Lee', 'Patricia Nguyen', 'Kevin Martinez', 'Susan Clark', 'Brian White', 'Rachel Green', 'Andrew Davis', 'Nicole Harris', 'Justin Lee');

-- Approved drafts
insert into public.reply_drafts (review_id, organization_id, content, version, is_approved, approved_at, approved_by)
select r.id, _org_id,
  case r.reviewer_name
    when 'Mark Taylor' then 'Thank you for your honest feedback, Mark. We strive to balance quality with fair pricing. We''d love to discuss our payment plans that can help make care more accessible. — The Riverside Dental Team'
    when 'Daniel Brown' then 'Thanks for considering us for your Invisalign journey, Daniel! We''re excited to help you achieve the smile you want. Our team is here for any questions as you decide. — The Riverside Dental Team'
    when 'Megan Cooper' then 'Thank you, Megan! We believe in recommending only what''s truly needed. Your trust means everything to us. — The Riverside Dental Team'
    else 'Thank you for your review! — The Riverside Dental Team'
  end,
  1, true, now() - interval '6 hours', _user_id
from public.reviews r
where r.organization_id = _org_id
  and r.reviewer_name in ('Mark Taylor', 'Daniel Brown', 'Megan Cooper');

-- Unapproved drafts
insert into public.reply_drafts (review_id, organization_id, content, version, is_approved)
select r.id, _org_id,
  case r.reviewer_name
    when 'Olivia Martinez' then 'What a wonderful review, Olivia! We love seeing entire families and we''re so glad everyone had a great time. The kids'' play area is one of our favorite additions! See you all soon! — The Riverside Dental Team'
    when 'Tyler Smith' then 'We''re glad we could help with your cracked tooth, Tyler! Our emergency team is always ready. Thank you for trusting us with your care! — The Riverside Dental Team'
    when 'Stephanie Garcia' then 'Stephanie, we''re so happy that sedation dentistry has made such a difference for you! Everyone deserves comfortable dental care without fear. — The Riverside Dental Team'
    else 'Thank you for your review! — The Riverside Dental Team'
  end,
  1, false
from public.reviews r
where r.organization_id = _org_id
  and r.reviewer_name in ('Olivia Martinez', 'Tyler Smith', 'Stephanie Garcia');

-- ---- Additional activity logs ----
insert into public.activity_logs (organization_id, user_id, action, entity_type, entity_id, metadata, created_at) values
  (_org_id, _user_id, 'review.created',    'review', null, '{"reviewer": "Amanda Foster", "rating": 5}',      '2025-10-02 12:00:00+00'),
  (_org_id, _user_id, 'reply.generated',   'reply_draft', null, '{"model": "gpt-4o-mini"}',                    '2025-10-02 12:01:00+00'),
  (_org_id, _user_id, 'reply.approved',    'reply_draft', null, '{}',                                           '2025-10-02 12:05:00+00'),
  (_org_id, _user_id, 'reply.posted',      'reply_draft', null, '{}',                                           '2025-10-02 12:10:00+00'),
  (_org_id, _user_id, 'review.imported',   'review', null, '{"source": "csv_import", "count": 5}',             '2025-11-17 09:00:00+00'),
  (_org_id, _user_id, 'reply.generated',   'reply_draft', null, '{"model": "gpt-4o-mini"}',                    '2025-12-02 14:00:00+00'),
  (_org_id, _user_id, 'reply.approved',    'reply_draft', null, '{}',                                           '2025-12-02 14:30:00+00'),
  (_org_id, _user_id, 'review.created',    'review', null, '{"reviewer": "Ryan Thompson", "rating": 1}',       '2026-02-14 10:00:00+00'),
  (_org_id, _user_id, 'review.status_changed', 'review', null, '{"from": "new", "to": "needs_attention"}',     '2026-02-14 10:15:00+00'),
  (_org_id, _user_id, 'reply.generated',   'reply_draft', null, '{"model": "gpt-4o-mini"}',                    '2026-02-18 11:00:00+00'),
  (_org_id, _user_id, 'review.created',    'review', null, '{"reviewer": "Nathan Wright", "rating": 5}',       '2026-03-02 08:30:00+00'),
  (_org_id, _user_id, 'review.created',    'review', null, '{"reviewer": "Jessica Patel", "rating": 4}',       '2026-03-05 09:00:00+00'),
  (_org_id, _user_id, 'review.created',    'review', null, '{"reviewer": "Derek Miller", "rating": 2}',        '2026-03-07 10:00:00+00'),
  (_org_id, _user_id, 'review.created',    'review', null, '{"reviewer": "Samantha Torres", "rating": 5}',     '2026-03-08 08:45:00+00');

-- ---- Upgrade subscription to Growth tier for demo ----
update public.subscriptions
set plan_tier = 'growth',
    status = 'active',
    review_limit = 500,
    reply_limit = 250,
    location_limit = 3,
    current_period_start = date_trunc('month', now()),
    current_period_end = date_trunc('month', now()) + interval '1 month'
where organization_id = _org_id;

end;
$$;
