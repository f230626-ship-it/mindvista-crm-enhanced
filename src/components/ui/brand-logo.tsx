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
  width?: number;
  height?: number;
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
  width,
  height,
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
    ? "(max-width: 640px) 120px, 160px"
    : "(max-width: 640px) 96px, 128px";

  const activeSizes = sizes ?? defaultSizes;

  const imgWidth = width ?? (isHorizontal ? 760 : 351);
  const imgHeight = height ?? (isHorizontal ? 160 : 277);

  return (
    <div className={cn("relative inline-block", className)}>
      <Image
        src={srcLight}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        sizes={activeSizes}
        priority={priority}
        className={cn("h-auto w-full max-w-full object-contain dark:hidden", lightClassName)}
        style={{ width: "auto", height: "auto" }}
      />
      <Image
        src={srcDark}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        sizes={activeSizes}
        priority={priority}
        className="h-auto w-full max-w-full object-contain hidden dark:block"
        style={{ width: "auto", height: "auto" }}
      />
    </div>
  );
}
