"use client";

import Link from "next/link";
import { useActionState } from "react";
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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start your free trial — no credit card required
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <Separator className="my-6" />

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
