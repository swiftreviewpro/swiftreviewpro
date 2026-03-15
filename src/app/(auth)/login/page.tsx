"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { IS_DEMO_MODE } from "@/lib/demo";
import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo/login", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        router.push(data.redirect ?? "/dashboard");
      }
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <>
      <Card className="shadow-xl shadow-primary/5 border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {state.error && (
            <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-10 rounded-xl"
              />
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-10 rounded-xl"
              />
              {state.fieldErrors?.password && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-10 rounded-xl btn-gradient border-0 font-semibold" disabled={isPending}>
              {isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <GoogleSignInButton label="Sign in with Google" />

          <Separator className="my-6" />

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-semibold hover:underline"
            >
              Sign up free
            </Link>
          </p>

          {IS_DEMO_MODE && (
            <>
              <Separator className="my-6" />
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                disabled={demoLoading}
                onClick={handleDemoLogin}
              >
                {demoLoading ? "Loading demo…" : "Try Demo →"}
              </Button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                No account needed — explore with sample data
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          256-bit encryption
        </div>
      </div>
    </>
  );
}
