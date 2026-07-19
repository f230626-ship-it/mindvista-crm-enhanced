import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center animate-fade-in">
      <div className="w-[6rem] sm:w-[7.5rem]">
        <BrandLogo
          lightLogoSrc="/images/mindvista-official-logo-light.png"
          darkLogoSrc="/images/mindvista-official-logo-dark.png"
          className="opacity-90"
          sizes="(max-width: 640px) 6rem, 7.5rem"
        />
      </div>
      <div>
        <h1 className="text-6xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/dashboard" className={cn(buttonVariants())}>
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Link>
        <BackButton />
      </div>
    </div>
  );
}
