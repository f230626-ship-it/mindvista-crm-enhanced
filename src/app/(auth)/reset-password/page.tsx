"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

// Supabase sends the user to this page with a hash fragment containing
// the access_token and refresh_token. The @supabase/ssr library's
// createBrowserClient picks these up automatically from the URL hash
// and sets the session cookies, so by the time the server action runs,
// supabase.auth.getUser() returns the password-reset user.
//
// The page therefore just needs to collect the new password and call
// the resetPassword server action, which calls supabase.auth.updateUser().

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    // Supabase appends error details as query params when the link is invalid
    const errCode = searchParams.get("error_code");
    if (errCode) {
      setTokenError(true);
    }
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await resetPassword(formData);

      if (result?.error) {
        setError(result.error.message);
        return;
      }

      setSuccess(true);
      // Redirect to login after a short delay so the user sees the success msg
      setTimeout(() => router.push("/login"), 2500);
    });
  }

  if (tokenError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            This password reset link is invalid or has expired. Please request a
            new one.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <AlertDescription className="text-green-700 dark:text-green-400">
          Password updated successfully. Redirecting to sign in…
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="animate-scale-in">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          disabled={isPending}
          required
          autoComplete="new-password"
          placeholder="At least 12 characters"
          className="bg-background/50"
        />
        <p className="text-xs text-muted-foreground">
          Must be 12+ characters with uppercase, lowercase, number, and symbol.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          disabled={isPending}
          required
          autoComplete="new-password"
          className="bg-background/50"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Updating…
          </span>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  );
}

function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <Card className="border-border/60 bg-card/90 shadow-2xl shadow-primary/5 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            <Image
              src="/images/logo.png"
              alt="MindVista"
              width={180}
              height={48}
              className="mx-auto h-10 w-auto object-contain"
              priority
            />
            <div>
              <CardTitle className="text-xl">Set new password</CardTitle>
              <CardDescription>Choose a strong password for your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="flex justify-center py-4"><Spinner /></div>}>
              <ResetPasswordForm />
            </Suspense>

            <div className="mt-4 flex justify-center">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
