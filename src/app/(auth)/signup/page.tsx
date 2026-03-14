"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
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
import { signUp, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { error: null };

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <>
      <Card className="shadow-xl shadow-primary/5 border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Start your free trial — no credit card required
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.error && (
            <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Jane Smith"
                autoComplete="name"
                required
                className="h-10 rounded-xl"
              />
              {state.fieldErrors?.full_name && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.full_name[0]}
                </p>
              )}
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="h-10 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
              {state.fieldErrors?.password && (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-10 rounded-xl btn-gradient border-0 font-semibold" disabled={isPending}>
              {isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Value props */}
      <div className="flex flex-col items-center gap-2 mt-6 text-xs text-muted-foreground">
        {["Free plan included", "No credit card required", "Cancel anytime"].map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            {t}
          </div>
        ))}
      </div>
    </>
  );
}
