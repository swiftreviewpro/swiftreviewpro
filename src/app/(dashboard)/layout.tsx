import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DemoBanner } from "@/components/shared/demo-banner";

/**
 * Dashboard layout — shared by all authenticated app routes.
 * Sidebar + Topbar + responsive content area.
 * Force dynamic rendering because this layout depends on auth state.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Push below mobile header */}
        <div className="pt-14 md:pt-0">
          <Topbar />
          <main className="page-padding max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
