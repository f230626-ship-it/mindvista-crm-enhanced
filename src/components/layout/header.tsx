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
  onMenuClick,
}: {
  employee: Employee;
  notifications: Notification[];
  unreadCount: number;
  onMenuClick?: () => void;
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

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setOpen(true);
    }
  };

  return (
    <header className="flex h-14 sm:h-16 md:h-18 items-center justify-between border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-card/80 px-3 sm:px-4 md:px-6 backdrop-blur-md shadow-sm shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
        <button
          onClick={handleMenuClick}
          className="lg:hidden flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{employee.full_name.split(" ")[0]}</span>
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
            <p className="text-[11px] sm:text-xs md:text-sm font-medium text-muted-foreground/80 truncate">{employee.designation}</p>
            <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 border-primary/20 bg-primary/5 text-primary/80 shrink-0">
              {ROLE_LABELS[employee.role]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 ml-2">
        <ThemeSwitcher />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      <DropdownMenu>
        <DropdownMenuTrigger className="relative inline-flex rounded-full outline-none transition-all duration-200 hover:scale-105 active:scale-95 shrink-0">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 border-2 border-primary/20 p-0.5 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md hover:shadow-lg transition-shadow">
            <AvatarImage src={employee.profile_photo_url ?? undefined} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xs sm:text-sm">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52 sm:w-56" align="end" sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-3">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-semibold truncate">{employee.full_name}</p>
                <p className="text-xs text-muted-foreground/70 truncate">{employee.email}</p>
                <Badge variant="secondary" className="w-fit border-primary/30 bg-primary/10 text-primary text-xs shrink-0">
                  {ROLE_LABELS[employee.role]}
                </Badge>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              {signingOut ? (
                <Spinner size="sm" className="mr-2 shrink-0" />
              ) : (
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
              )}
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
