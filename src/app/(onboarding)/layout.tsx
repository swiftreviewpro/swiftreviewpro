import { Logo } from "@/components/icons/logo";

/**
 * Onboarding layout — clean full-screen layout without sidebar.
 * Used only for the /onboarding route.
 */
export const dynamic = "force-dynamic";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-center mb-8">
          <Logo size="lg" />
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SwiftReview Pro. All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
