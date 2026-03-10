"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import type { Location } from "@/lib/types";
import {
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/lib/actions/location-actions";
import { checkLocationLimit } from "@/lib/actions/billing-actions";

interface LocationsClientProps {
  initialLocations: Location[];
}

const EMPTY_FORM = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
};

export function LocationsClient({ initialLocations }: LocationsClientProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const openCreate = useCallback(async () => {
    // Check location limit first
    const limit = await checkLocationLimit();
    if (!limit.allowed) {
      toast.error(
        `Location limit reached (${limit.current}/${limit.limit}). Upgrade your plan for more.`
      );
      return;
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((loc: Location) => {
    setForm({
      name: loc.name,
      address: loc.address ?? "",
      city: loc.city ?? "",
      state: loc.state ?? "",
      zip: loc.zip ?? "",
      phone: loc.phone ?? "",
    });
    setEditingId(loc.id);
    setError(null);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      if (editingId) {
        const result = await updateLocation(editingId, form);
        if (result.error) {
          setError(result.error);
          return;
        }
        setLocations((prev) =>
          prev.map((l) => (l.id === editingId && result.data ? result.data : l))
        );
        toast.success("Location updated");
      } else {
        const result = await createLocation(form);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.data) {
          setLocations((prev) => [...prev, result.data!]);
          toast.success("Location created");
        }
      }
      setDialogOpen(false);
    });
  }, [editingId, form]);

  const handleDelete = useCallback((loc: Location) => {
    if (!window.confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteLocation(loc.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
      toast.success("Location deleted");
    });
  }, []);

  const updateField = useCallback(
    (field: keyof typeof EMPTY_FORM, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const activeLocations = locations.filter((l) => l.is_active);
  const archivedLocations = locations.filter((l) => !l.is_active);

  return (
    <>
      {/* Header action */}
      <div className="flex justify-end -mt-2 mb-2">
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Location
        </Button>
      </div>

      {/* Empty state */}
      {locations.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first business location to start managing reviews."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Location
            </Button>
          }
        />
      )}

      {/* Active locations grid */}
      {activeLocations.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLocations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={() => openEdit(loc)}
              onDelete={() => handleDelete(loc)}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* Archived */}
      {archivedLocations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Archived ({archivedLocations.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {archivedLocations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                onEdit={() => openEdit(loc)}
                onDelete={() => handleDelete(loc)}
                disabled={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the details for this location."
                : "Add a new business location."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Downtown Office"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input
                  value={form.zip}
                  onChange={(e) => updateField("zip", e.target.value)}
                  placeholder="ZIP"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.name.trim()}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {editingId ? "Save Changes" : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------- Location Card ----------

function LocationCard({
  location,
  onEdit,
  onDelete,
  disabled,
}: {
  location: Location;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const addressParts = [location.address, location.city, location.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="card-elevated card-padding space-y-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{location.name}</h3>
            {!location.is_active && (
              <Badge variant="secondary" className="text-[10px]">
                Archived
              </Badge>
            )}
          </div>
          {addressParts && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {addressParts}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            disabled={disabled}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={disabled}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4 pt-2 border-t text-muted-foreground">
        {location.phone && (
          <div className="flex items-center gap-1.5 text-xs">
            <Phone className="h-3 w-3" />
            {location.phone}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <Building2 className="h-3 w-3" />
          {location.zip || "No ZIP"}
        </div>
      </div>
    </div>
  );
}
