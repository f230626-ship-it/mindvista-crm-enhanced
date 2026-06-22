import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";

export default function PortalNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-fade-in">
      <Image src="/images/logo-icon.png" alt="" width={40} height={40} className="opacity-60" />
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        This section doesn&apos;t exist yet or you may not have permission to view it.
      </p>
      <Link href="/dashboard" className={cn(buttonVariants({ size: "sm" }))}>
        <Home className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
