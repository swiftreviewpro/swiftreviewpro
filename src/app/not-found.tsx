import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-6xl font-bold text-muted-foreground/30 mb-4">404</div>
      <h1 className="text-xl font-semibold mb-2">Page Not Found</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
