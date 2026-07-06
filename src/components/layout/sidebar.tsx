"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";
import {
  LayoutDashboard,
  User,
  CalendarDays,
  FileText,
  Package,
  Users,
  CheckSquare,
  Star,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  description?: string;
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
    description: "Project management"
  },
  { 
    title: "Team", 
    href: "/team", 
    icon: Users,
    description: "Company directory"
  },
  { 
    title: "Profile", 
    href: "/profile", 
    icon: User,
    description: "Personal settings"
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
    roles: ["admin"],
    description: "Manage staff"
  },
  { 
    title: "Leave Approvals", 
    href: "/admin/leaves", 
    icon: CheckSquare, 
    roles: ["admin", "manager"],
    description: "Review requests"
  },
  { 
    title: "Performance Reviews", 
    href: "/admin/performance", 
    icon: Star, 
    roles: ["admin", "manager"],
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
}: {
  item: NavItem;
  active: boolean;
  index: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
        "animate-slide-up opacity-0 [animation-fill-mode:forwards] hover:scale-105 active:scale-95",
        active
          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
          : "text-sidebar-foreground/70 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-sidebar-foreground hover:shadow-md"
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
      {active && (
        <ChevronRight className="h-4 w-4 shrink-0" />
      )}
      
      {/* Active indicator */}
      {active && (
        <div className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-primary-foreground shadow-sm" />
      )}
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

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const filteredAdminNav = adminNav.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex h-16 items-center justify-center gap-3 border-b border-sidebar-border/50 px-6">
        <Link href="/dashboard" className="flex items-center justify-center group">
          <Image
            src="/images/logo.png"
            alt="MindVista"
            width={140}
            height={40}
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Portal Section */}
        <div>
          <SectionHeader title="Portal" badge={employeeNav.length} />
          <div className="space-y-1">
            {employeeNav.map((item, i) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              return <NavLink key={item.href} item={item} active={active} index={i} />;
            })}
          </div>
        </div>

        {/* Management Section */}
        {filteredAdminNav.length > 0 && (
          <div>
            <SectionHeader title="Management" badge={filteredAdminNav.length} />
            <div className="space-y-1">
              {filteredAdminNav.map((item, i) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={active}
                    index={i + employeeNav.length}
                  />
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 p-4">
        <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-3 text-center">
          <p className="text-[10px] font-medium text-sidebar-foreground/60">
            MindVista HRMS v1.0
          </p>
          <p className="text-[9px] text-sidebar-foreground/40 mt-1">
            Enterprise Edition
          </p>
        </div>
      </div>
    </aside>
  );
}
