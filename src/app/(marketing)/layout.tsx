import Link from "next/link";
import { Logo } from "@/components/icons/logo";

/**
 * Marketing layout — polished glass header + rich footer for public pages.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — glass morphism */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-gradient inline-flex items-center justify-center h-9 px-5 rounded-xl text-sm font-semibold"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer — richer with links */}
      <footer className="border-t bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2 md:col-span-1">
              <Logo size="sm" />
              <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                AI-powered review management for local businesses.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} SwiftReview Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
