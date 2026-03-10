import Link from "next/link";
import {
  Zap,
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Marketing landing page — / route
 */
export default function LandingPage() {
  return (
    <div className="section-gap">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Review Management
          </div>
          <h1 className="text-display md:text-5xl lg:text-6xl max-w-3xl mx-auto mb-6">
            Respond to Reviews{" "}
            <span className="text-primary">Faster & Smarter</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            SwiftReview Pro helps local businesses craft professional,
            on-brand responses to customer reviews in seconds — not hours.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-14">
          <h2>Everything you need to manage reviews</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            From AI-generated responses to multi-location analytics,
            SwiftReview Pro has you covered.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "AI Responses",
              desc: "Generate professional, on-brand responses to every review in seconds.",
            },
            {
              icon: Shield,
              title: "Brand Guardrails",
              desc: "Set tone, ban phrases, and escalation rules to stay compliant.",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              desc: "Track ratings, response rates, and sentiment across all locations.",
            },
            {
              icon: Star,
              title: "Multi-Location",
              desc: "Manage reviews for all your locations from a single dashboard.",
            },
          ].map((f) => (
            <div key={f.title} className="card-interactive card-padding text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="mb-1.5">{f.title}</h4>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h2>Three simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Import Reviews",
                desc: "Connect your platforms or import via CSV. We pull reviews automatically.",
              },
              {
                step: "2",
                title: "Generate Responses",
                desc: "AI crafts on-brand replies aligned with your tone and guidelines.",
              },
              {
                step: "3",
                title: "Approve & Post",
                desc: "Review, edit if needed, and post responses directly to the platform.",
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  {s.step}
                </div>
                <h4 className="mb-1.5">{s.title}</h4>
                <p className="text-sm text-muted-foreground max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-14">
          <h2>Simple, transparent pricing</h2>
          <p className="text-muted-foreground mt-2">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              desc: "Try it out",
              features: ["50 reviews/month", "20 AI replies", "1 location"],
            },
            {
              name: "Starter",
              price: "$29",
              desc: "Small business",
              features: ["200 reviews/month", "100 AI replies", "5 locations", "Full analytics"],
              popular: true,
            },
            {
              name: "Pro",
              price: "$79",
              desc: "Growing business",
              features: ["1,000 reviews/month", "500 AI replies", "20 locations", "Priority support"],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`card-elevated card-padding relative ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <h4>{plan.name}</h4>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-white">Ready to respond smarter?</h2>
          <p className="text-primary-foreground/80 mt-2 mb-8">
            Join thousands of local businesses using SwiftReview Pro.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-8 text-base"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
