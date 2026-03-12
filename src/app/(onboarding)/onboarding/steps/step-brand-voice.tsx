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
import { MessageSquareText } from "lucide-react";
import type { OnboardingStep2Data } from "@/lib/validation/schemas";

const TONE_PRESETS = [
  "Professional and friendly",
  "Warm and empathetic",
  "Formal and corporate",
  "Casual and approachable",
  "Enthusiastic and thankful",
] as const;

/**
 * Example AI replies for each tone — helps users pick the right voice.
 * Each shows a sample reply to a positive and negative review.
 */
const TONE_EXAMPLES: Record<string, { positive: string; negative: string }> = {
  "Professional and friendly": {
    positive:
      "Thank you so much for taking the time to share your experience! We\u2019re thrilled our team made a great impression \u2014 they\u2019ll be really happy to hear this. We look forward to seeing you again soon.",
    negative:
      "Thank you for letting us know about this. We completely understand your frustration, and we\u2019re sorry things didn\u2019t go the way they should have. We\u2019d really like the chance to make it right \u2014 please reach out to us directly so we can help.",
  },
  "Warm and empathetic": {
    positive:
      "This really made our day \u2014 thank you for such kind words! Our team genuinely cares about every person who walks through our doors, and it means the world to know that came through in your visit. We can\u2019t wait to welcome you back!",
    negative:
      "We\u2019re truly sorry to hear this wasn\u2019t the experience you deserved. Your feelings are completely valid, and we want you to know we take this to heart. Please give us the opportunity to make things right \u2014 we\u2019d love to connect with you personally.",
  },
  "Formal and corporate": {
    positive:
      "We sincerely appreciate your feedback and are pleased to learn that your experience met expectations. Our team strives for excellence in every interaction, and your recognition is valued. We look forward to serving you again.",
    negative:
      "We appreciate you bringing this matter to our attention. We hold our service to a high standard, and we regret that we fell short in this instance. We would welcome the opportunity to discuss this further and resolve the situation to your satisfaction.",
  },
  "Casual and approachable": {
    positive:
      "Awesome \u2014 so glad you had a great time! Our crew really does go above and beyond, and they\u2019ll love hearing this. See you next time!",
    negative:
      "Ugh, that\u2019s definitely not the experience we want for anyone. Thanks for being upfront about it \u2014 we\u2019re on it. Drop us a line and let\u2019s figure out how to make this right for you.",
  },
  "Enthusiastic and thankful": {
    positive:
      "WOW, thank you so much \u2014 this feedback absolutely made our week! We\u2019re so grateful you took the time to share, and our team is doing a little happy dance right now. Can\u2019t wait to see you again!",
    negative:
      "Thank you so much for sharing this \u2014 we know it\u2019s not easy, and we\u2019re genuinely grateful for your honesty. We\u2019re really disappointed we let you down and are eager to turn this around. Please reach out so we can make it up to you!",
  },
};

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
  const selectedTone = data.tone ?? "";
  const examples = TONE_EXAMPLES[selectedTone] ?? null;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="tone">
          Default Tone <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedTone}
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

      {/* Tone example preview */}
      {examples && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquareText className="h-4 w-4 text-primary" />
            Preview &mdash; how your AI replies will sound
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                To a positive review
              </p>
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                &ldquo;{examples.positive}&rdquo;
              </p>
            </div>
            <div className="border-t pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                To a negative review
              </p>
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                &ldquo;{examples.negative}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

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
