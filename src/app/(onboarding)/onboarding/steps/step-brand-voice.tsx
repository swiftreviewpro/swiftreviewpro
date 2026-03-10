"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingStep2Data } from "@/lib/validation/schemas";

const TONE_PRESETS = [
  "Professional and friendly",
  "Warm and empathetic",
  "Formal and corporate",
  "Casual and approachable",
  "Enthusiastic and thankful",
] as const;

const CLOSING_STYLES = [
  "Warm sign-off with team name",
  "Invitation to return",
  "Direct contact offer",
  "Simple thank you",
  "No closing",
] as const;

interface StepBrandVoiceProps {
  data: Partial<OnboardingStep2Data>;
  errors: Record<string, string[] | undefined>;
  onChange: (field: string, value: string) => void;
}

export function StepBrandVoice({
  data,
  errors,
  onChange,
}: StepBrandVoiceProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="tone">
          Default Tone <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.tone ?? ""}
          onValueChange={(val) => onChange("tone", val ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a tone" />
          </SelectTrigger>
          <SelectContent>
            {TONE_PRESETS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Sets the default personality for AI-generated replies.
        </p>
        {errors.tone && (
          <p className="text-xs text-destructive">{errors.tone[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="style_notes">Style Notes</Label>
        <Textarea
          id="style_notes"
          value={data.style_notes ?? ""}
          onChange={(e) => onChange("style_notes", e.target.value)}
          placeholder="e.g. We're a family-friendly practice. Emphasize patient comfort and care quality."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Additional context the AI will use when crafting replies.
        </p>
        {errors.style_notes && (
          <p className="text-xs text-destructive">{errors.style_notes[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="banned_phrases">Banned Phrases</Label>
        <Textarea
          id="banned_phrases"
          value={data.banned_phrases ?? ""}
          onChange={(e) => onChange("banned_phrases", e.target.value)}
          placeholder='e.g. "sorry for any inconvenience", "per our policy"'
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated phrases the AI should never use.
        </p>
        {errors.banned_phrases && (
          <p className="text-xs text-destructive">
            {errors.banned_phrases[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="signature_line">Signature Line</Label>
          <Input
            id="signature_line"
            value={data.signature_line ?? ""}
            onChange={(e) => onChange("signature_line", e.target.value)}
            placeholder="— The Riverside Team"
          />
          {errors.signature_line && (
            <p className="text-xs text-destructive">
              {errors.signature_line[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="closing_style">Closing Style</Label>
          <Select
            value={data.closing_style ?? ""}
            onValueChange={(val) => onChange("closing_style", val ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a style" />
            </SelectTrigger>
            <SelectContent>
              {CLOSING_STYLES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.closing_style && (
            <p className="text-xs text-destructive">
              {errors.closing_style[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
