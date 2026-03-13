"use client";

import { useCallback, useState, useTransition } from "react";
import {
  Plug,
  RefreshCw,
  Trash2,
  Unplug,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Star,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Integration, IntegrationProvider } from "@/lib/types";
import {
  syncIntegration,
  toggleAutoImport,
  disconnectIntegration,
  deleteIntegration,
  connectYelp,
  searchYelpForSetup,
  getGoogleOAuthUrl,
} from "@/lib/actions/integration-actions";

// ============================================================================
// Integration Card
// ============================================================================

function IntegrationCard({
  integration,
  onRefresh,
}: {
  integration: Integration;
  onRefresh: () => void;
}) {
  const [isSyncing, startSync] = useTransition();
  const [isToggling, startToggle] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    disconnected: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle2 className="h-3.5 w-3.5" />,
    paused: <Clock className="h-3.5 w-3.5" />,
    error: <AlertCircle className="h-3.5 w-3.5" />,
    disconnected: <Unplug className="h-3.5 w-3.5" />,
  };

  const providerLabels: Record<IntegrationProvider, string> = {
    google_business: "Google Business",
    yelp: "Yelp",
  };

  const handleSync = useCallback(() => {
    startSync(async () => {
      const result = await syncIntegration(integration.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Synced: ${result.imported} imported, ${result.skipped} skipped`
        );
        onRefresh();
      }
    });
  }, [integration.id, onRefresh]);

  const handleToggleAuto = useCallback(() => {
    startToggle(async () => {
      const newValue = !integration.auto_import;
      const result = await toggleAutoImport(integration.id, newValue);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          newValue ? "Auto-import enabled" : "Auto-import disabled"
        );
        onRefresh();
      }
    });
  }, [integration.id, integration.auto_import, onRefresh]);

  const handleDisconnect = useCallback(() => {
    startDisconnect(async () => {
      const result = await disconnectIntegration(integration.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Integration disconnected");
        onRefresh();
      }
    });
  }, [integration.id, onRefresh]);

  const handleDelete = useCallback(() => {
    startDelete(async () => {
      const result = await deleteIntegration(integration.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Integration removed");
        setShowDelete(false);
        onRefresh();
      }
    });
  }, [integration.id, onRefresh]);

  const isDisabled = integration.status === "disconnected";
  const isPending = isSyncing || isToggling || isDisconnecting;

  return (
    <>
      <div className="card-elevated card-padding">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                integration.provider === "google_business"
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {integration.provider === "google_business" ? (
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  G
                </span>
              ) : (
                <Star className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">{integration.label}</h3>
              <p className="text-xs text-muted-foreground">
                {providerLabels[integration.provider]}
                {integration.location?.name &&
                  ` · ${integration.location.name}`}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              statusColors[integration.status] ?? statusColors.disconnected
            }`}
          >
            {statusIcons[integration.status]}
            {integration.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">
              {integration.review_count ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
          <div>
            <p className="text-sm font-medium">
              {integration.auto_import ? "On" : "Off"}
            </p>
            <p className="text-xs text-muted-foreground">Auto-import</p>
          </div>
          <div>
            <p className="text-sm font-medium">
              {integration.last_synced_at
                ? new Date(integration.last_synced_at).toLocaleDateString()
                : "Never"}
            </p>
            <p className="text-xs text-muted-foreground">Last Sync</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isDisabled || isPending}
            onClick={handleSync}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isDisabled || isPending}
            onClick={handleToggleAuto}
          >
            {isToggling
              ? "Updating…"
              : integration.auto_import
                ? "Disable Auto"
                : "Enable Auto"}
          </Button>

          {integration.status !== "disconnected" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleDisconnect}
            >
              <Unplug className="mr-1.5 h-3.5 w-3.5" />
              {isDisconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Integration</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this integration. Reviews already
              imported will be kept. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// Connect Google Dialog
// ============================================================================

function ConnectGoogleDialog({
  open,
  onOpenChange,
  locations,
  orgId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: { id: string; name: string }[];
  orgId: string;
}) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [isRedirecting, startRedirect] = useTransition();

  const handleConnect = () => {
    if (!locationId) {
      toast.error("Please select a location.");
      return;
    }
    startRedirect(async () => {
      const state = JSON.stringify({ locationId, orgId });
      const result = await getGoogleOAuthUrl(state);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Failed to generate Google sign-in URL.");
        return;
      }
      window.location.href = result.url;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Google Business Profile</DialogTitle>
          <DialogDescription>
            Connect your Google Business Profile to automatically import
            reviews. You&apos;ll be redirected to sign in with Google.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={locationId} onValueChange={(v) => v && setLocationId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which location to link to your Google Business Profile.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={!locationId}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Sign in with Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Connect Yelp Dialog
// ============================================================================

function ConnectYelpDialog({
  open,
  onOpenChange,
  locations,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"search" | "select">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [businesses, setBusinesses] = useState<
    {
      id: string;
      name: string;
      city: string;
      state: string;
      rating: number;
      review_count: number;
    }[]
  >([]);
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isConnecting, startConnect] = useTransition();

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim() || !searchLocation.trim()) {
      toast.error("Enter a business name and city.");
      return;
    }
    startSearch(async () => {
      const result = await searchYelpForSetup(
        searchTerm.trim(),
        searchLocation.trim()
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBusinesses(result.businesses);
      if (result.businesses.length > 0) {
        setStep("select");
      } else {
        toast.error("No businesses found. Try a different search.");
      }
    });
  }, [searchTerm, searchLocation]);

  const handleConnect = useCallback(() => {
    if (!selectedBiz || !locationId) {
      toast.error("Please select a business and location.");
      return;
    }
    startConnect(async () => {
      const result = await connectYelp(selectedBiz, locationId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Yelp connected successfully!");
      onOpenChange(false);
      onSuccess();
      // Reset
      setStep("search");
      setBusinesses([]);
      setSelectedBiz(null);
      setSearchTerm("");
      setSearchLocation("");
    });
  }, [selectedBiz, locationId, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Yelp Business</DialogTitle>
          <DialogDescription>
            Search for your business on Yelp to connect it. Reviews will be
            imported from the Yelp Fusion API.
          </DialogDescription>
        </DialogHeader>

        {step === "search" ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                placeholder="e.g. Joe's Pizza"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label>City / Location</Label>
              <Input
                placeholder="e.g. New York, NY"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label>Link to Location</Label>
              <Select value={locationId} onValueChange={(v) => v && setLocationId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="mr-1.5 h-3.5 w-3.5" />
                {isSearching ? "Searching…" : "Search Yelp"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select your business from the results:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {businesses.map((biz) => (
                <button
                  key={biz.id}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedBiz === biz.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setSelectedBiz(biz.id)}
                >
                  <div className="font-medium text-sm">{biz.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {biz.city}, {biz.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {biz.rating} ({biz.review_count} reviews)
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("search");
                  setSelectedBiz(null);
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!selectedBiz || isConnecting}
              >
                <Plug className="mr-1.5 h-3.5 w-3.5" />
                {isConnecting ? "Connecting…" : "Connect"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Integrations Client Component
// ============================================================================

export function IntegrationsClient({
  initialIntegrations,
  locations,
  orgId,
  isPaid,
}: {
  initialIntegrations: Integration[];
  locations: { id: string; name: string }[];
  orgId: string;
  isPaid: boolean;
}) {
  const [integrations, setIntegrations] =
    useState<Integration[]>(initialIntegrations);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [showYelpDialog, setShowYelpDialog] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const refresh = useCallback(() => {
    startRefresh(async () => {
      const { listIntegrations } = await import(
        "@/lib/actions/integration-actions"
      );
      const result = await listIntegrations();
      if (!result.error) {
        setIntegrations(result.data);
      }
    });
  }, []);

  // ---- Upgrade CTA for free users ----
  if (!isPaid) {
    return (
      <div className="card-elevated card-padding text-center py-12">
        <Plug className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Platform Integrations
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Connect Google Business Profile and Yelp to automatically import and
          manage reviews from one place. Available on Starter plans and above.
        </p>
        <a href="/billing">
          <Button>Upgrade to Unlock Integrations</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connect Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowGoogleDialog(true)}>
          <span className="mr-1.5 font-bold text-sm">G</span>
          Connect Google Business
        </Button>
        <Button variant="outline" onClick={() => setShowYelpDialog(true)}>
          <Star className="mr-1.5 h-4 w-4" />
          Connect Yelp
        </Button>
      </div>

      {/* Integration Cards */}
      {integrations.length === 0 ? (
        <div className="card-elevated card-padding text-center py-12">
          <Plug className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold mb-1">No Integrations Yet</h3>
          <p className="text-sm text-muted-foreground">
            Connect Google Business or Yelp above to start importing reviews
            automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Flash message from URL params */}
      <UrlFlashMessage />

      {/* Dialogs */}
      <ConnectGoogleDialog
        open={showGoogleDialog}
        onOpenChange={setShowGoogleDialog}
        locations={locations}
        orgId={orgId}
      />
      <ConnectYelpDialog
        open={showYelpDialog}
        onOpenChange={setShowYelpDialog}
        locations={locations}
        onSuccess={refresh}
      />
    </div>
  );
}

// ---- Show success/error from URL params (after Google OAuth callback) ----

function UrlFlashMessage() {
  const [shown, setShown] = useState(false);

  // Only runs client-side
  if (typeof window === "undefined" || shown) return null;

  const params = new URLSearchParams(window.location.search);
  const success = params.get("success");
  const error = params.get("error");

  if (success || error) {
    // Show toast on next tick so it appears after hydration
    setTimeout(() => {
      if (success) toast.success(success);
      if (error) toast.error(error);
      setShown(true);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname);
    }, 100);
  }

  return null;
}
