import { Logo } from "@/components/icons/logo";

/**
 * Auth layout — centered card layout for login/signup pages.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} SwiftReview Pro. All rights reserved.
      </p>
    </div>
  );
}
