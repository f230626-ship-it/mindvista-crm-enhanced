import Image from "next/image";

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center animate-fade-in bg-gradient-to-b from-background/95 to-background/90 dark:from-background dark:to-background">
      <div className="loading-logo-wrapper">
        <div className="loading-logo-center-glow" />
        <Image
          src="/images/mindvista-loading-logo.png"
          alt="MindVista"
          width={160}
          height={160}
          className="opacity-100 object-contain relative z-10 loading-logo-filter"
          priority
        />
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background/95 to-background/90 dark:from-background dark:to-background animate-fade-in">
      <div className="loading-logo-wrapper">
        <div className="loading-logo-center-glow" />
        <Image
          src="/images/mindvista-loading-logo.png"
          alt="MindVista"
          width={200}
          height={200}
          className="opacity-100 object-contain relative z-10 loading-logo-filter"
          priority
        />
      </div>
    </div>
  );
}
