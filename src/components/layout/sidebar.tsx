"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";
import type { PMRole } from "@/types/database";

// Extend UserRole to include legacy "Developer" role
type ExtendedUserRole = UserRole | "Developer";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Package,
  Users,
  CheckSquare,
  Star,
  Briefcase,
  LineChart,
  ChevronRight,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";

import { X } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  description?: string;
  salesHref?: boolean;
}

const employeeNav: NavItem[] = [
  { 
    title: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    description: "Overview & analytics"
  },
  { 
    title: "Projects", 
    href: "/projects", 
    icon: Briefcase,
    description: "Project management",
    roles: ["admin"]
  },
  { 
    title: "My Team", 
    href: "/team", 
    icon: Users,
    description: "Company directory"
  },
  { 
    title: "Leave", 
    href: "/leave", 
    icon: CalendarDays,
    description: "Time off requests"
  },
  { 
    title: "Policies", 
    href: "/policies", 
    icon: FileText,
    description: "Company policies"
  },
  { 
    title: "Assets", 
    href: "/assets", 
    icon: Package,
    description: "Equipment tracking"
  },
  {
    title: "Sales",
    href: "/sales",
    icon: LineChart,
    description: "Outreach & performance",
    salesHref: true,
  },
  { 
    title: "My Performance", 
    href: "/performance", 
    icon: Star,
    description: "Goals & reviews"
  },
];

const adminNav: NavItem[] = [
  { 
    title: "Employees", 
    href: "/admin/employees", 
    icon: Users, 
    roles: ["admin", "hr"],
    description: "Manage staff"
  },
  { 
    title: "Leave Approvals", 
    href: "/admin/leaves", 
    icon: CheckSquare, 
    roles: ["admin"],
    description: "Review requests"
  },
  { 
    title: "Performance Reviews", 
    href: "/admin/performance", 
    icon: Star, 
    roles: ["admin"],
    description: "Team evaluations"
  },
  { 
    title: "Assets", 
    href: "/admin/assets", 
    icon: Package, 
    roles: ["admin"],
    description: "Equipment management"
  },
  { 
    title: "Policies", 
    href: "/admin/policies", 
    icon: FileText, 
    roles: ["admin"],
    description: "Document management"
  },
  { 
    title: "Holidays", 
    href: "/admin/holidays", 
    icon: CalendarDays, 
    roles: ["admin"],
    description: "Company calendar"
  },
];

function NavLink({
  item,
  active,
  index,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  index: number;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
        "animate-slide-up opacity-0 fill-mode-[forwards] hover:scale-105 active:scale-95",
        active
          ? "bg-linear-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
          : "text-sidebar-foreground/70 hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5 hover:text-sidebar-foreground hover:shadow-md"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
          active && "drop-shadow-sm"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{item.title}</div>
        {item.description && (
          <div className="text-xs opacity-75 truncate">
            {item.description}
          </div>
        )}
      </div>
    </Link>
  );
}

function SectionHeader({ title, badge }: { title: string; badge?: number }) {
  return (
    <div className="flex items-center justify-between mb-3 px-4">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
        {title}
      </h3>
      {badge !== undefined && (
        <Badge variant="secondary" className="text-[10px] h-5 px-2">
          {badge}
        </Badge>
      )}
    </div>
  );
}

export function Sidebar({
  role,
  pmRole,
  profilePhotoUrl,
  fullName,
  designation,
  onNavClick,
  onClose,
}: {
  role: ExtendedUserRole;
  pmRole: PMRole;
  profilePhotoUrl?: string | null;
  fullName?: string;
  designation?: string;
  onNavClick?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const showSales = role === "admin" || role === "Developer";
  const isBd = pmRole === "bd" || (designation || "").toLowerCase().includes("business developer") || (designation || "").toLowerCase().includes("bd ");
  const filteredEmployeeNav = employeeNav.filter((item) => {
    if (item.salesHref) return showSales || isBd;
    return !item.roles || item.roles.includes(role as UserRole);
  });

  // Special handling for admin navigation - include "Developer" as admin-equivalent
  const filteredAdminNav = adminNav.filter((item) => {
    if (!item.roles) return true;
    
    // Allow if role is in the allowed roles OR if user is "Developer" and item allows "admin"
    return item.roles.includes(role as UserRole) || 
           (role === "Developer" && item.roles.includes("admin"));
  });

  return (
    <aside className="flex h-full w-[280px] sm:w-[300px] lg:w-[288px] xl:w-[288px] 2xl:w-[320px] flex-col border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between border-b border-sidebar-border/50 px-3 sm:px-4 md:px-6 pt-1 shrink-0">
        <Link href="/dashboard" className="flex items-center justify-center group flex-1">
          <BrandLogo
            lightLogoSrc="/images/mindvista-sidebar-logo-light.png"
            darkLogoSrc="/images/mindvista-sidebar-logo-dark.png"
            priority
            className="w-28 sm:w-32 md:w-36 dark:w-32 dark:sm:w-36 dark:md:w-40 transition-transform group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 5rem, 6rem"
          />
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-sidebar-accent transition-colors shrink-0 ml-2"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-4 sm:space-y-5 md:space-y-6 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
        {/* Portal Section */}
        <div>
          <SectionHeader title="Portal" />
          <div className="space-y-1">
            {filteredEmployeeNav.map((item, i) => {
              const effectiveHref = item.salesHref
                ? showSales
                  ? "/sales/command"
                  : "/sales/my-day"
                : item.href;

              const active = item.salesHref
                ? pathname.startsWith("/sales")
                : pathname === effectiveHref ||
                  (effectiveHref !== "/dashboard" &&
                    pathname.startsWith(effectiveHref + "/"));

              return (
                <NavLink
                  key={effectiveHref}
                  item={{ ...item, href: effectiveHref }}
                  active={active}
                  index={i}
                  onClick={onNavClick}
                />
              );
            })}
          </div>
        </div>

        {/* Management Section */}
        {filteredAdminNav.length > 0 && (
          <div>
            <SectionHeader title="Management" />
            <div className="space-y-1">
              {filteredAdminNav.map((item, i) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={active}
                    index={i + filteredEmployeeNav.length}
                    onClick={onNavClick}
                  />
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer - Profile Card */}
      <div className="border-t border-sidebar-border/50 px-2.5 sm:px-3 py-1.5 sm:py-2 shrink-0">
        <Link
          href="/profile"
          className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5 group"
        >
          <div className="relative shrink-0">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={fullName ?? "Profile"}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
              />
            ) : (
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-[10px] sm:text-xs">
                {fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "U"}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border-2 border-sidebar bg-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs font-semibold truncate text-sidebar-foreground">
              {fullName ?? "User"}
            </p>
            <p className="text-[9px] sm:text-[10px] text-sidebar-foreground/60 truncate">
              {designation ?? "Employee"}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
