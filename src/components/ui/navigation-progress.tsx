"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(20);
    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(90), 300);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setVisible(false), 200);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out glow-brand"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
