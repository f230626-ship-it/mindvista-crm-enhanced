"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  lightLogoSrc?: string;
  darkLogoSrc?: string;
  variant?: "horizontal" | "stacked";
  lightClassName?: string;
};

export function BrandLogo({
  alt = "MindVista",
  className,
  priority = false,
  sizes,
  lightLogoSrc,
  darkLogoSrc,
  variant = "horizontal",
  lightClassName,
}: BrandLogoProps) {
  const isHorizontal = variant === "horizontal";

  const defaultLight = isHorizontal
    ? "/images/mindvista-brand-light.svg"
    : "/images/mindvista-official-logo-light.png";

  const defaultDark = isHorizontal
    ? "/images/mindvista-brand-dark.svg"
    : "/images/mindvista-official-logo-dark.png";

  const srcLight = lightLogoSrc ?? defaultLight;
  const srcDark = darkLogoSrc ?? defaultDark;

  const defaultSizes = isHorizontal
    ? "(max-width: 640px) 4.5rem, 5.5rem"
    : "(max-width: 640px) 6rem, 7.5rem";

  const activeSizes = sizes ?? defaultSizes;

  return (
    <div className={cn("relative inline-block", className)}>
      <Image
        src={srcLight}
        alt={alt}
        width={isHorizontal ? 760 : 351}
        height={isHorizontal ? 160 : 277}
        sizes={activeSizes}
        priority={priority}
        className={cn("h-auto w-full max-w-full object-contain dark:hidden", lightClassName)}
      />
      <Image
        src={srcDark}
        alt={alt}
        width={isHorizontal ? 760 : 358}
        height={isHorizontal ? 160 : 268}
        sizes={activeSizes}
        priority={priority}
        className="h-auto w-full max-w-full object-contain hidden dark:block"
      />
    </div>
  );
}
