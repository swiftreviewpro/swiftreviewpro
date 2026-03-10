"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert } from "lucide-react";
import type { OnboardingStep3Data } from "@/lib/validation/schemas";

interface StepEscalationProps {
  data: Partial<OnboardingStep3Data>;
  errors: Record<string, string[] | undefined>;
  onChange: (field: string, value: string | boolean) => void;
}

export function StepEscalation({
  data,
  errors,
  onChange,
}: StepEscalationProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <div className="flex gap-3">
          <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              How we handle negative reviews
            </p>
            When a review is rated 1–2 stars, SwiftReview Pro can include a
            personalized escalation message offering to resolve the issue
            offline. Configure your escalation preferences below.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="escalation_email">Escalation Email</Label>
          <Input
            id="escalation_email"
            value={data.escalation_email ?? ""}
            onChange={(e) => onChange("escalation_email", e.target.value)}
            placeholder="support@yourbusiness.com"
            type="email"
          />
          <p className="text-xs text-muted-foreground">
            Included in replies to negative reviews.
          </p>
          {errors.escalation_email && (
            <p className="text-xs text-destructive">
              {errors.escalation_email[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="escalation_phone">Escalation Phone</Label>
          <Input
            id="escalation_phone"
            value={data.escalation_phone ?? ""}
            onChange={(e) => onChange("escalation_phone", e.target.value)}
            placeholder="(555) 123-4567"
            type="tel"
          />
          <p className="text-xs text-muted-foreground">
            Optional direct line for unhappy customers.
          </p>
          {errors.escalation_phone && (
            <p className="text-xs text-destructive">
              {errors.escalation_phone[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="escalation_wording">Escalation Message</Label>
        <Textarea
          id="escalation_wording"
          value={data.escalation_wording ?? ""}
          onChange={(e) => onChange("escalation_wording", e.target.value)}
          placeholder="We'd love to discuss this further. Please reach out to us directly at [your contact info] so we can make this right."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Custom wording appended to replies on negative reviews.
        </p>
        {errors.escalation_wording && (
          <p className="text-xs text-destructive">
            {errors.escalation_wording[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() =>
            onChange(
              "allow_offline_resolution",
              !data.allow_offline_resolution
            )
          }
          className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div>
            <p className="text-sm font-medium">Allow offline resolution</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Include &quot;let&apos;s take this offline&quot; language in
              negative review replies.
            </p>
          </div>
          <div
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              data.allow_offline_resolution
                ? "bg-primary"
                : "bg-muted-foreground/25"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                data.allow_offline_resolution
                  ? "translate-x-5"
                  : "translate-x-0"
              }`}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
