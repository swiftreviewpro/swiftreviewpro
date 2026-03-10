// ============================================================================
// Navigation Configuration
// ============================================================================

import {
  LayoutDashboard,
  MessageSquare,
  MapPin,
  BarChart3,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

export const dashboardNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and key metrics",
  },
  {
    label: "Reviews",
    href: "/reviews",
    icon: MessageSquare,
    description: "Manage and respond to reviews",
  },
  {
    label: "Locations",
    href: "/locations",
    icon: MapPin,
    description: "Manage business locations",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Review performance insights",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Brand voice and preferences",
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
    description: "Subscription and usage",
  },
];
