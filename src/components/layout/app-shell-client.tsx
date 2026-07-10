"use client";

import { useState, createContext, useContext } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AnimatedPage } from "@/components/ui/animated-page";
import type { Employee, Notification } from "@/types/database";

const SidebarContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AppShellClient({
  employee,
  notifications,
  unreadCount,
  children,
}: {
  employee: Employee;
  notifications: Notification[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar
            role={employee.role}
            pmRole={employee.pm_role}
            profilePhotoUrl={employee.profile_photo_url}
            fullName={employee.full_name}
            designation={employee.designation}
            onNavClick={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header
            employee={employee}
            notifications={notifications}
            unreadCount={unreadCount}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-background">
            <AnimatedPage>{children}</AnimatedPage>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
