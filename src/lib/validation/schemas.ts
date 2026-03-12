// ============================================================================
// Validation Schemas — Zod schemas for all request/form validation
// ============================================================================
// Canonical path: @/lib/validation/schemas
// Used by server actions, API route handlers, and client-side forms.
// ============================================================================

import { z } from "zod";
import { REVIEW_STATUSES, REVIEW_SOURCES } from "@/lib/types";

// ---------- Auth ----------
export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// ---------- Organization ----------
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100)
    .optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
});

// ---------- Location ----------
export const createLocationSchema = z.object({
  name: z.string().min(2, "Location name is required").max(200),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  google_place_id: z.string().max(255).optional().or(z.literal("")),
});

export const updateLocationSchema = createLocationSchema.partial().extend({
  is_active: z.boolean().optional(),
});

// ---------- Brand Settings ----------
export const brandSettingsSchema = z.object({
  tone: z.string().min(1, "Tone is required").max(500),
  style_notes: z.string().max(2000).optional().or(z.literal("")),
  banned_phrases: z.string().max(2000).optional().or(z.literal("")),
  signature_line: z.string().max(500).optional().or(z.literal("")),
  escalation_wording: z.string().max(2000).optional().or(z.literal("")),
  additional_instructions: z.string().max(2000).optional().or(z.literal("")),
});

// ---------- Review ----------
const reviewStatusEnum = z.enum(REVIEW_STATUSES);

const reviewSourceEnum = z.enum(REVIEW_SOURCES);

export const createReviewSchema = z.object({
  location_id: z.string().uuid("Please select a location"),
  reviewer_name: z.string().min(1, "Reviewer name is required").max(200),
  rating: z.number().int().min(1, "Rating must be 1–5").max(5, "Rating must be 1–5"),
  review_text: z.string().min(1, "Review text is required").max(10000),
  platform: z.string().min(1, "Platform is required").max(100),
  review_date: z.string().optional(),
  source: reviewSourceEnum.optional().default("manual"),
});

export const updateReviewSchema = z.object({
  status: reviewStatusEnum.optional(),
  reviewer_name: z.string().min(1).max(200).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().min(1).max(10000).optional(),
  platform: z.string().min(1).max(100).optional(),
});

// ---------- Reply Draft ----------
export const updateDraftSchema = z.object({
  review_id: z.string().uuid(),
  content: z.string().min(1, "Reply content is required").max(5000),
});

export const approveDraftSchema = z.object({
  draft_id: z.string().uuid(),
});

// ---------- CSV Import ----------
export const csvReviewRowSchema = z.object({
  reviewer_name: z.string().min(1),
  rating: z.string().regex(/^[1-5]$/, "Rating must be 1–5"),
  review_text: z.string().min(1),
  platform: z.string().min(1),
  review_date: z.string().min(1),
  location_name: z.string().optional(),
});

// ---------- Organization Members ----------
export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["admin", "member"]),
});

// ---------- Onboarding Steps ----------
export const onboardingStep1Schema = z.object({
  business_name: z.string().min(2, "Business name is required").max(100),
  category: z.string().min(1, "Category is required").max(100),
  website: z
    .string()
    .url("Please enter a valid URL")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  timezone: z.string().min(1, "Timezone is required"),
});

export const onboardingStep2Schema = z.object({
  tone: z.string().min(1, "Default tone is required").max(500),
  style_notes: z
    .string()
    .min(10, "Please add at least a sentence about your brand voice — this helps the AI write more authentic replies")
    .max(2000),
  banned_phrases: z.string().max(2000).optional().or(z.literal("")),
  signature_line: z.string().max(500).optional().or(z.literal("")),
  closing_style: z.string().min(1, "Closing style is required").max(500),
});

export const onboardingStep3Schema = z.object({
  escalation_email: z
    .string()
    .email("Please enter a valid email")
    .max(255)
    .optional()
    .or(z.literal("")),
  escalation_phone: z.string().max(30).optional().or(z.literal("")),
  escalation_wording: z.string().max(2000).optional().or(z.literal("")),
  allow_offline_resolution: z.boolean().default(false),
}).refine(
  (d) =>
    (d.escalation_email && d.escalation_email.length > 0) ||
    (d.escalation_phone && d.escalation_phone.length > 0),
  {
    message: "Please provide at least an escalation email or phone so unhappy customers can reach you",
    path: ["escalation_email"],
  }
);

export const onboardingStep4Schema = z.object({
  location_name: z.string().min(2, "Location name is required").max(200),
  location_address: z.string().max(500).optional().or(z.literal("")),
  location_city: z.string().max(100).optional().or(z.literal("")),
  location_state: z.string().max(100).optional().or(z.literal("")),
});

export const onboardingCompleteSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)
  .merge(onboardingStep4Schema);

// ---------- Inferred Form Types ----------
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationFormData = z.infer<typeof updateOrganizationSchema>;
export type CreateLocationFormData = z.infer<typeof createLocationSchema>;
export type UpdateLocationFormData = z.infer<typeof updateLocationSchema>;
export type BrandSettingsFormData = z.infer<typeof brandSettingsSchema>;
export type CreateReviewFormData = z.infer<typeof createReviewSchema>;
export type UpdateReviewFormData = z.infer<typeof updateReviewSchema>;
export type UpdateDraftFormData = z.infer<typeof updateDraftSchema>;
export type CsvReviewRowData = z.infer<typeof csvReviewRowSchema>;
export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4Data = z.infer<typeof onboardingStep4Schema>;
export type OnboardingCompleteData = z.infer<typeof onboardingCompleteSchema>;
