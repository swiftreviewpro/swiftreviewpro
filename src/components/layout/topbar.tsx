"use client";

import { Search, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/lib/auth/actions";

interface TopbarProps {
  /** Page title to display in the topbar (optional) */
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useUser();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/70 backdrop-blur-xl px-4 md:px-8">
      {/* Left: Page title */}
      {title && (
        <>
          <h2 className="text-title hidden md:block">{title}</h2>
          <Separator orientation="vertical" className="hidden md:block h-6" />
        </>
      )}

      {/* Center: Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search — coming soon"
            disabled
            className="pl-9 h-9 bg-muted/40 border-0 rounded-xl opacity-60 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground rounded-xl"
          disabled
          aria-label="Notifications — coming soon"
        >
          <Bell className="w-4 h-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 rounded-xl hover:bg-accent h-9 transition-colors">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">
                {user?.full_name ?? "Account"}
              </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                const form = document.createElement("form");
                form.method = "POST";
                form.action = "";
                document.body.appendChild(form);
                // Use the server action via a hidden form
              }}
            >
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
