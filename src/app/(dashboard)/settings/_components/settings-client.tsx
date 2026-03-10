"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { BrandSettings, Organization } from "@/lib/types";
import { updateBrandSettings } from "@/lib/actions/brand-settings-actions";

interface SettingsClientProps {
  brandSettings: BrandSettings | null;
  organization: Organization | null;
}

export function SettingsClient({
  brandSettings,
  organization,
}: SettingsClientProps) {
  return (
    <Tabs defaultValue="brand" className="space-y-6">
      <TabsList>
        <TabsTrigger value="brand">Brand Voice</TabsTrigger>
        <TabsTrigger value="organization">Organization</TabsTrigger>
      </TabsList>

      <TabsContent value="brand">
        <BrandVoiceForm initialData={brandSettings} />
      </TabsContent>

      <TabsContent value="organization">
        <OrganizationInfo org={organization} />
      </TabsContent>
    </Tabs>
  );
}

// ---------- Brand Voice Form ----------

function BrandVoiceForm({
  initialData,
}: {
  initialData: BrandSettings | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tone, setTone] = useState(initialData?.tone ?? "");
  const [styleNotes, setStyleNotes] = useState(
    initialData?.style_notes ?? ""
  );
  const [bannedPhrases, setBannedPhrases] = useState(
    initialData?.banned_phrases?.join(", ") ?? ""
  );
  const [signatureLine, setSignatureLine] = useState(
    initialData?.signature_line ?? ""
  );
  const [escalationWording, setEscalationWording] = useState(
    initialData?.escalation_wording ?? ""
  );
  const [additionalInstructions, setAdditionalInstructions] = useState(
    initialData?.additional_instructions ?? ""
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      startTransition(async () => {
        const result = await updateBrandSettings({
          tone,
          style_notes: styleNotes,
          banned_phrases: bannedPhrases,
          signature_line: signatureLine,
          escalation_wording: escalationWording,
          additional_instructions: additionalInstructions,
        });
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        } else {
          toast.success("Brand settings saved");
        }
      });
    },
    [
      tone,
      styleNotes,
      bannedPhrases,
      signatureLine,
      escalationWording,
      additionalInstructions,
    ]
  );

  return (
    <div className="card-elevated card-padding max-w-2xl">
      <h3 className="mb-1">Brand Voice Settings</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configure how AI-generated responses should sound across your
        organization.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Tone *</Label>
          <Input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g., Professional and friendly"
          />
          <p className="text-caption">
            Choose a preset or type a custom description
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Style Notes</Label>
          <Textarea
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            placeholder="e.g., Always thank the reviewer first. Keep positive responses under 3 sentences."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Banned Phrases</Label>
          <Textarea
            value={bannedPhrases}
            onChange={(e) => setBannedPhrases(e.target.value)}
            placeholder="e.g., I'm sorry you feel that way, as per our policy"
            rows={2}
          />
          <p className="text-caption">
            Comma-separated list of phrases to exclude
          </p>
        </div>

        <div className="space-y-2">
          <Label>Signature Line</Label>
          <Input
            value={signatureLine}
            onChange={(e) => setSignatureLine(e.target.value)}
            placeholder="e.g., — The Acme Team"
          />
        </div>

        <div className="space-y-2">
          <Label>Escalation Wording</Label>
          <Textarea
            value={escalationWording}
            onChange={(e) => setEscalationWording(e.target.value)}
            placeholder="e.g., We'd love the chance to make this right. Please call (555) 123-4567."
            rows={3}
          />
          <p className="text-caption">
            Used in responses to negative reviews
          </p>
        </div>

        <div className="space-y-2">
          <Label>Additional Instructions</Label>
          <Textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Any additional context for the AI..."
            rows={3}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending || !tone.trim()}>
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save Brand Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- Organization Info (read-only for now) ----------

function OrganizationInfo({ org }: { org: Organization | null }) {
  if (!org) {
    return (
      <div className="card-elevated card-padding text-center py-8">
        <p className="text-muted-foreground text-sm">
          Unable to load organization details.
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated card-padding max-w-md">
      <h3 className="mb-1">Organization</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Your organization profile and details.
      </p>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">
            Organization Name
          </Label>
          <p className="text-sm font-medium">{org.name}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Slug</Label>
          <p className="text-sm text-muted-foreground">{org.slug}</p>
        </div>
        {org.category && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Category</Label>
            <p className="text-sm">{org.category}</p>
          </div>
        )}
        {org.website && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Website</Label>
            <p className="text-sm">{org.website}</p>
          </div>
        )}
        {org.phone && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Phone</Label>
            <p className="text-sm">{org.phone}</p>
          </div>
        )}
        {(org.city || org.state) && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Location</Label>
            <p className="text-sm">
              {[org.city, org.state].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Created</Label>
          <p className="text-sm text-muted-foreground">
            {new Date(org.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
