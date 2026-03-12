"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingStep1Data } from "@/lib/validation/schemas";

const BUSINESS_CATEGORIES = [
  "Dental Practice",
  "Medical Practice",
  "Restaurant",
  "Retail Store",
  "Auto Service",
  "Home Services",
  "Legal Services",
  "Fitness / Wellness",
  "Beauty / Salon",
  "Real Estate",
  "Hospitality / Hotel",
  "Financial Services",
  "Education",
  "Other",
] as const;

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
] as const;

const US_STATES = [
  { abbr: "AL", name: "Alabama", tz: "America/Chicago" },
  { abbr: "AK", name: "Alaska", tz: "America/Anchorage" },
  { abbr: "AZ", name: "Arizona", tz: "America/Denver" },
  { abbr: "AR", name: "Arkansas", tz: "America/Chicago" },
  { abbr: "CA", name: "California", tz: "America/Los_Angeles" },
  { abbr: "CO", name: "Colorado", tz: "America/Denver" },
  { abbr: "CT", name: "Connecticut", tz: "America/New_York" },
  { abbr: "DE", name: "Delaware", tz: "America/New_York" },
  { abbr: "FL", name: "Florida", tz: "America/New_York" },
  { abbr: "GA", name: "Georgia", tz: "America/New_York" },
  { abbr: "HI", name: "Hawaii", tz: "Pacific/Honolulu" },
  { abbr: "ID", name: "Idaho", tz: "America/Boise" },
  { abbr: "IL", name: "Illinois", tz: "America/Chicago" },
  { abbr: "IN", name: "Indiana", tz: "America/Indiana/Indianapolis" },
  { abbr: "IA", name: "Iowa", tz: "America/Chicago" },
  { abbr: "KS", name: "Kansas", tz: "America/Chicago" },
  { abbr: "KY", name: "Kentucky", tz: "America/New_York" },
  { abbr: "LA", name: "Louisiana", tz: "America/Chicago" },
  { abbr: "ME", name: "Maine", tz: "America/New_York" },
  { abbr: "MD", name: "Maryland", tz: "America/New_York" },
  { abbr: "MA", name: "Massachusetts", tz: "America/New_York" },
  { abbr: "MI", name: "Michigan", tz: "America/Detroit" },
  { abbr: "MN", name: "Minnesota", tz: "America/Chicago" },
  { abbr: "MS", name: "Mississippi", tz: "America/Chicago" },
  { abbr: "MO", name: "Missouri", tz: "America/Chicago" },
  { abbr: "MT", name: "Montana", tz: "America/Denver" },
  { abbr: "NE", name: "Nebraska", tz: "America/Chicago" },
  { abbr: "NV", name: "Nevada", tz: "America/Los_Angeles" },
  { abbr: "NH", name: "New Hampshire", tz: "America/New_York" },
  { abbr: "NJ", name: "New Jersey", tz: "America/New_York" },
  { abbr: "NM", name: "New Mexico", tz: "America/Denver" },
  { abbr: "NY", name: "New York", tz: "America/New_York" },
  { abbr: "NC", name: "North Carolina", tz: "America/New_York" },
  { abbr: "ND", name: "North Dakota", tz: "America/Chicago" },
  { abbr: "OH", name: "Ohio", tz: "America/New_York" },
  { abbr: "OK", name: "Oklahoma", tz: "America/Chicago" },
  { abbr: "OR", name: "Oregon", tz: "America/Los_Angeles" },
  { abbr: "PA", name: "Pennsylvania", tz: "America/New_York" },
  { abbr: "RI", name: "Rhode Island", tz: "America/New_York" },
  { abbr: "SC", name: "South Carolina", tz: "America/New_York" },
  { abbr: "SD", name: "South Dakota", tz: "America/Chicago" },
  { abbr: "TN", name: "Tennessee", tz: "America/Chicago" },
  { abbr: "TX", name: "Texas", tz: "America/Chicago" },
  { abbr: "UT", name: "Utah", tz: "America/Denver" },
  { abbr: "VT", name: "Vermont", tz: "America/New_York" },
  { abbr: "VA", name: "Virginia", tz: "America/New_York" },
  { abbr: "WA", name: "Washington", tz: "America/Los_Angeles" },
  { abbr: "WV", name: "West Virginia", tz: "America/New_York" },
  { abbr: "WI", name: "Wisconsin", tz: "America/Chicago" },
  { abbr: "WY", name: "Wyoming", tz: "America/Denver" },
  { abbr: "DC", name: "District of Columbia", tz: "America/New_York" },
] as const;

/** Map state abbreviation → closest standard timezone from our selector */
function timezoneForState(abbr: string): string | null {
  const st = US_STATES.find((s) => s.abbr === abbr);
  if (!st) return null;
  // Normalize sub-zone variants to our main picker values
  const tz = st.tz;
  if (tz.startsWith("America/New_York") || tz.includes("Indianapolis") || tz.includes("Detroit"))
    return "America/New_York";
  if (tz.startsWith("America/Chicago")) return "America/Chicago";
  if (tz.startsWith("America/Denver") || tz.startsWith("America/Boise"))
    return "America/Denver";
  if (tz.startsWith("America/Los_Angeles")) return "America/Los_Angeles";
  if (tz.startsWith("America/Anchorage")) return "America/Anchorage";
  if (tz.startsWith("Pacific/Honolulu")) return "Pacific/Honolulu";
  return null;
}

interface StepBusinessProfileProps {
  data: Partial<OnboardingStep1Data>;
  errors: Record<string, string[] | undefined>;
  onChange: (field: string, value: string) => void;
}

export function StepBusinessProfile({
  data,
  errors,
  onChange,
}: StepBusinessProfileProps) {
  // Track whether we've auto-set timezone for the current state
  const lastAutoState = useRef<string | null>(null);

  // Auto-set timezone when state changes
  useEffect(() => {
    const st = data.state;
    if (st && st !== lastAutoState.current) {
      lastAutoState.current = st;
      const tz = timezoneForState(st);
      if (tz) {
        onChange("timezone", tz);
      }
    }
  }, [data.state, onChange]);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="business_name">
          Business Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="business_name"
          value={data.business_name ?? ""}
          onChange={(e) => onChange("business_name", e.target.value)}
          placeholder="Riverside Dental Group"
          autoFocus
        />
        {errors.business_name && (
          <p className="text-xs text-destructive">{errors.business_name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">
          Category <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.category ?? ""}
          onValueChange={(val) => onChange("category", val ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={data.website ?? ""}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://example.com"
            type="url"
          />
          {errors.website && (
            <p className="text-xs text-destructive">{errors.website[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={data.phone ?? ""}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="(555) 123-4567"
            type="tel"
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={data.city ?? ""}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="e.g. Riverside"
          />
          <p className="text-xs text-muted-foreground">
            Your primary business city.
          </p>
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.state ?? ""}
            onValueChange={(val) => onChange("state", val ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {US_STATES.map((s) => (
                <SelectItem key={s.abbr} value={s.abbr}>
                  {s.name} ({s.abbr})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Timezone will auto-adjust.
          </p>
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">
          Timezone <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.timezone ?? "America/New_York"}
          onValueChange={(val) => onChange("timezone", val ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {US_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Auto-filled from your state. Override if needed.
        </p>
        {errors.timezone && (
          <p className="text-xs text-destructive">{errors.timezone[0]}</p>
        )}
      </div>
    </div>
  );
}
