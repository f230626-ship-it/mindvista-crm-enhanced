import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative">
        <Image
          src="/images/logo-icon.png"
          alt="MindVista"
          width={48}
          height={48}
          className="opacity-90"
        />
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <Spinner size="sm" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function FullPageLoader({ message = "Loading MindVista..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Image
        src="/images/logo.png"
        alt="MindVista"
        width={180}
        height={48}
        className="animate-pulse opacity-90"
        priority
      />
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
