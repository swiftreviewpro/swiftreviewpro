"use client";

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
            placeholder="Riverside"
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state">
            State <span className="text-destructive">*</span>
          </Label>
          <Input
            id="state"
            value={data.state ?? ""}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="CA"
          />
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
        {errors.timezone && (
          <p className="text-xs text-destructive">{errors.timezone[0]}</p>
        )}
      </div>
    </div>
  );
}
