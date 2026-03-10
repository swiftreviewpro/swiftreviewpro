"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import type { OnboardingStep4Data } from "@/lib/validation/schemas";

interface StepFirstLocationProps {
  data: Partial<OnboardingStep4Data>;
  errors: Record<string, string[] | undefined>;
  onChange: (field: string, value: string) => void;
  businessCity?: string;
  businessState?: string;
}

export function StepFirstLocation({
  data,
  errors,
  onChange,
  businessCity,
  businessState,
}: StepFirstLocationProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-info/30 bg-info/5 p-4">
        <div className="flex gap-3">
          <MapPin className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Add your first business location. Reviews will be organized by
            location. You can add more locations later from the dashboard.
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location_name">
          Location Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location_name"
          value={data.location_name ?? ""}
          onChange={(e) => onChange("location_name", e.target.value)}
          placeholder="Downtown Office"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          A friendly name to identify this location (e.g. &quot;Main
          Office&quot;, &quot;Eastside Branch&quot;).
        </p>
        {errors.location_name && (
          <p className="text-xs text-destructive">
            {errors.location_name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location_address">Street Address</Label>
        <Input
          id="location_address"
          value={data.location_address ?? ""}
          onChange={(e) => onChange("location_address", e.target.value)}
          placeholder="123 Main St"
        />
        {errors.location_address && (
          <p className="text-xs text-destructive">
            {errors.location_address[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location_city">City</Label>
          <Input
            id="location_city"
            value={data.location_city ?? businessCity ?? ""}
            onChange={(e) => onChange("location_city", e.target.value)}
            placeholder="Riverside"
          />
          {errors.location_city && (
            <p className="text-xs text-destructive">
              {errors.location_city[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location_state">State</Label>
          <Input
            id="location_state"
            value={data.location_state ?? businessState ?? ""}
            onChange={(e) => onChange("location_state", e.target.value)}
            placeholder="CA"
          />
          {errors.location_state && (
            <p className="text-xs text-destructive">
              {errors.location_state[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
