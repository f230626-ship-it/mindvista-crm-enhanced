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
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const employeeNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", href: "/profile", icon: User },
  { title: "Leave", href: "/leave", icon: CalendarDays },
  { title: "Policies", href: "/policies", icon: FileText },
  { title: "Assets", href: "/assets", icon: Package },
  { title: "Performance", href: "/performance", icon: Star },
];

const adminNav: NavItem[] = [
  { title: "Employees", href: "/admin/employees", icon: Users, roles: ["admin"] },
  { title: "Leave Approvals", href: "/admin/leaves", icon: CheckSquare, roles: ["admin", "manager"] },
  { title: "Performance", href: "/admin/performance", icon: Star, roles: ["admin", "manager"] },
  { title: "Assets", href: "/admin/assets", icon: Package, roles: ["admin"] },
  { title: "Policies", href: "/admin/policies", icon: FileText, roles: ["admin"] },
  { title: "Holidays", href: "/admin/holidays", icon: CalendarDays, roles: ["admin"] },
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
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "animate-slide-up opacity-0 [animation-fill-mode:forwards]",
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
          active && "drop-shadow-sm"
        )}
      />
      {item.title}
    </Link>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const filteredAdminNav = adminNav.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <Image
          src="/images/logo.png"
          alt="MindVista"
          width={130}
          height={36}
          className="h-8 w-auto object-contain"
          priority
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Portal
        </p>
        {employeeNav.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return <NavLink key={item.href} item={item} active={active} index={i} />;
        })}

        {filteredAdminNav.length > 0 && (
          <>
            <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Management
            </p>
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
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-[10px] text-sidebar-foreground/40">MindVista HRMS v1.0</p>
      </div>
    </aside>
  );
}
