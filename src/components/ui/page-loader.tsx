import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 animate-fade-in">
      <Image
        src="/images/logo.png"
        alt="MindVista"
        width={140}
        height={38}
        className="opacity-80 object-contain"
        priority
      />
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" className="text-primary/70" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function FullPageLoader({ message = "Loading MindVista..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background animate-fade-in">
      <Image
        src="/images/logo.png"
        alt="MindVista"
        width={180}
        height={48}
        className="animate-pulse opacity-90 object-contain"
        priority
      />
      <div className="flex flex-col items-center gap-3">
        <Spinner size="md" className="text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
