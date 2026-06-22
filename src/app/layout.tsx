import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/ui/navigation-progress";

export const metadata: Metadata = {
  title: "MindVista HRMS",
  description: "Internal HR management system for MindVista",
  icons: { icon: "/images/logo-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NavigationProgress />
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "border-border bg-card text-card-foreground shadow-lg",
            },
          }}
        />
      </body>
    </html>
  );
}
