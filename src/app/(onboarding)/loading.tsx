export default function OnboardingLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading setup…</p>
      </div>
    </div>
  );
}
