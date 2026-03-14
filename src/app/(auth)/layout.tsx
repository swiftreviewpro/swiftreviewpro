import { Logo } from "@/components/icons/logo";

/**
 * Auth layout — premium centered card with mesh gradient background.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 bg-dots opacity-20" />
      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full bg-primary/6 blur-3xl" />
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 rounded-full bg-primary/4 blur-3xl" />

      <div className="relative mb-8">
        <Logo size="lg" />
      </div>
      <div className="relative w-full max-w-md">{children}</div>
      <p className="relative mt-8 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} SwiftReview Pro. All rights reserved.
      </p>
    </div>
  );
}
