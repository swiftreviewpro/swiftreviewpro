"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MessageSquareText,
  ShieldAlert,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
} from "@/lib/validation/schemas";
import type { OnboardingCompleteData } from "@/lib/validation/schemas";
import { completeOnboarding } from "@/lib/auth/onboarding-action";
import type { OnboardingActionState } from "@/lib/auth/onboarding-action";
import { StepBusinessProfile } from "./steps/step-business-profile";
import { StepBrandVoice } from "./steps/step-brand-voice";
import { StepEscalation } from "./steps/step-escalation";
import { StepFirstLocation } from "./steps/step-first-location";
import type { ZodSchema } from "zod";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface StepConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  schema: ZodSchema;
}

const STEPS: StepConfig[] = [
  {
    title: "Business Profile",
    description: "Tell us about your business",
    icon: Building2,
    schema: onboardingStep1Schema,
  },
  {
    title: "Brand Voice",
    description: "How should AI‑generated replies sound?",
    icon: MessageSquareText,
    schema: onboardingStep2Schema,
  },
  {
    title: "Escalation Rules",
    description: "Handle negative reviews gracefully",
    icon: ShieldAlert,
    schema: onboardingStep3Schema,
  },
  {
    title: "First Location",
    description: "Add your first business location",
    icon: MapPin,
    schema: onboardingStep4Schema,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<OnboardingCompleteData>>({
    timezone: "America/New_York",
    allow_offline_resolution: false,
  });
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ---- helpers ----
  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServerError(null);
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const schema = STEPS[currentStep].schema;
    const result = schema.safeParse(formData);
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    const flat = result.error.flatten().fieldErrors as Record<
      string,
      string[] | undefined
    >;
    setFieldErrors(flat);
    return false;
  }, [currentStep, formData]);

  // ---- navigation ----
  const goNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [validateCurrentStep]);

  const goBack = useCallback(() => {
    setFieldErrors({});
    setServerError(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  // ---- submit ----
  const handleSubmit = useCallback(() => {
    if (!validateCurrentStep()) return;

    startTransition(async () => {
      const result: OnboardingActionState = await completeOnboarding(
        formData as Record<string, unknown>
      );
      if (result.error) {
        setServerError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(
            result.fieldErrors as Record<string, string[] | undefined>
          );
        }
      }
      // On success the server action redirects to /dashboard
    });
  }, [validateCurrentStep, formData]);

  const isLastStep = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Progress Indicator ---- */}
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={s.title} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex items-center w-full gap-1">
                {/* Left connector */}
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      done ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                {/* Circle */}
                <div
                  className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {/* Right connector */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-colors ${
                      done ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[11px] font-medium leading-tight text-center ${
                  active
                    ? "text-primary"
                    : done
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* ---- Step Card ---- */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <StepIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
          <span className="ml-auto text-xs font-medium text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step content */}
        {currentStep === 0 && (
          <StepBusinessProfile
            data={formData}
            errors={fieldErrors}
            onChange={handleChange}
          />
        )}
        {currentStep === 1 && (
          <StepBrandVoice
            data={formData}
            errors={fieldErrors}
            onChange={handleChange}
          />
        )}
        {currentStep === 2 && (
          <StepEscalation
            data={formData}
            errors={fieldErrors}
            onChange={handleChange}
          />
        )}
        {currentStep === 3 && (
          <StepFirstLocation
            data={formData}
            errors={fieldErrors}
            onChange={handleChange}
            businessCity={formData.city ?? undefined}
            businessState={formData.state ?? undefined}
          />
        )}

        {/* Server error */}
        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={currentStep === 0 || isPending}
            className={currentStep === 0 ? "invisible" : ""}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  Finish Setup
                  <CheckCircle2 className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button size="sm" onClick={goNext} disabled={isPending}>
              Next
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
