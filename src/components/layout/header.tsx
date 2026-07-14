"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/constants";
import type { Employee, Notification } from "@/types/database";
import { LogOut, User, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { useSidebar } from "@/components/layout/app-shell-client";

export function Header({
  employee,
  notifications,
  unreadCount,
}: {
  employee: Employee;
  notifications: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { setOpen } = useSidebar();
  const initials = employee.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[2200px] flex items-center justify-between">
      <div className="flex items-center gap-3 animate-fade-in">
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-semibold">
            Welcome,{" "}
            <span className="text-gradient-brand">{employee.full_name.split(" ")[0]}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{employee.designation}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeSwitcher />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      <DropdownMenu>
        <DropdownMenuTrigger className="relative inline-flex rounded-full outline-none ring-primary/30 transition-all hover:ring-2 focus-visible:ring-2">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/30 p-1 bg-background">
            <AvatarImage src={employee.profile_photo_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary rounded-full">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{employee.full_name}</p>
                <p className="text-xs text-muted-foreground">{employee.email}</p>
                <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary">
                  {ROLE_LABELS[employee.role]}
                </Badge>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-destructive focus:text-destructive"
            >
              {signingOut ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
