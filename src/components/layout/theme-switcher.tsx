"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by rendering only after mounting on the client
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-0" />
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-300 rotate-0 scale-100 text-amber-400" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-300 rotate-0 scale-100 text-slate-700" />
      )}
    </Button>
  );
}
