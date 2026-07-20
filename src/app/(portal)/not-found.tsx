import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function PortalNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-fade-in">
      <div className="w-[4.5rem] sm:w-[5.5rem]">
        <BrandLogo
          lightLogoSrc="/images/mindvista-official-logo-light.png"
          darkLogoSrc="/images/mindvista-official-logo-dark.png"
          alt=""
          className="opacity-80"
          sizes="(max-width: 640px) 4.5rem, 5.5rem"
        />
      </div>
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
