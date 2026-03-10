"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <Separator className="my-6" />

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>

        {IS_DEMO_MODE && (
          <>
            <Separator className="my-6" />
            <Button
              type="button"
              variant="outline"
              className="w-full"
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
  );
}
