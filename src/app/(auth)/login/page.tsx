"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "no_employee_profile") {
      setError(
        "Your account exists but has no employee profile. Ask an admin to link your account."
      );
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Connection failed. Please check your network and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient glow */}
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
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your HRMS account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-scale-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@mindvista.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-background/50"
                />
              </div>
              <Button type="submit" className="w-full glow-brand" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Contact your administrator for account access
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
