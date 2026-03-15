import Link from "next/link";
import {
  Zap,
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  Sparkles,
  TrendingUp,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Marketing landing page — / route
 * 2026 design: mesh gradients, glass cards, conversion-focused layout
 */
export default function LandingPage() {
  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-dots opacity-40" />
        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-[15%] w-72 h-72 rounded-full bg-primary/8 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-[10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-28 text-center">
          {/* Trust pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Review Management
          </div>

          <h1 className="text-display md:text-5xl lg:text-6xl xl:text-7xl max-w-4xl mx-auto mb-6 animate-slide-up">
            Respond to Reviews{" "}
            <span className="text-gradient">Faster & Smarter</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: "100ms" }}>
            SwiftReview Pro helps local businesses craft professional,
            on-brand responses to customer reviews in seconds — not hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Link href="/signup">
              <Button size="lg" className="btn-gradient h-13 px-8 text-base rounded-xl">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base rounded-xl border-border/60 bg-white/50 backdrop-blur-sm hover:bg-white/80">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Value props row */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">AI-Generated</span> responses
            </div>
            <span className="hidden sm:inline text-border">|</span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Google &amp; Yelp</span> integration
            </div>
            <span className="hidden sm:inline text-border">|</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Free plan</span> available
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logos / Social Proof Bar ─── */}
      <section className="border-y bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
            Works with platforms you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-muted-foreground/60">
            {["Google Business", "Yelp"].map((name) => (
              <span key={name} className="text-sm font-semibold tracking-wide">{name}</span>
            ))}
            <span className="text-sm font-medium tracking-wide italic">More platforms coming soon</span>
          </div>
        </div>
      </section>

      {/* ─── Features — Bento Grid ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" /> Features
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Everything you need to manage reviews
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-lg">
            From AI-generated responses to multi-location analytics,
            SwiftReview Pro has you covered.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {/* Feature 1 — large card */}
          <div className="card-interactive card-padding sm:col-span-2 lg:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/8 transition-colors duration-500" />
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Responses</h3>
              <p className="text-muted-foreground max-w-md">
                Generate professional, on-brand responses to every review in seconds.
                Our AI understands context, sentiment, and your brand voice to craft the perfect reply.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card-interactive card-padding group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-bold mb-1.5">Brand Guardrails</h4>
            <p className="text-sm text-muted-foreground">
              Set tone, ban phrases, and escalation rules to stay compliant and on-brand.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-interactive card-padding group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-bold mb-1.5">Smart Analytics</h4>
            <p className="text-sm text-muted-foreground">
              Track ratings, response rates, and sentiment trends across all your locations.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card-interactive card-padding group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-bold mb-1.5">Multi-Platform</h4>
            <p className="text-sm text-muted-foreground">
              Google, Yelp, and more. Manage all reviews from a single dashboard.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card-interactive card-padding group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5 group-hover:scale-110 transition-transform duration-300">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-bold mb-1.5">Multi-Location</h4>
            <p className="text-sm text-muted-foreground">
              Manage reviews for all your locations — from one to hundreds — in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-muted/40" />
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Three simple steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {[
              {
                step: "1",
                title: "Import Reviews",
                desc: "Connect your platforms or import via CSV. We pull reviews automatically.",
                icon: TrendingUp,
              },
              {
                step: "2",
                title: "Generate Responses",
                desc: "AI crafts on-brand replies aligned with your tone and guidelines.",
                icon: Sparkles,
              },
              {
                step: "3",
                title: "Approve & Post",
                desc: "Review, edit if needed, and post responses directly to the platform.",
                icon: CheckCircle2,
              },
            ].map((s) => (
              <div key={s.step} className="relative card-elevated card-padding text-center group">
                {/* Step number */}
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-extrabold mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
                  {s.step}
                </div>
                <h4 className="font-bold mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why SwiftReview Pro ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {[
            { value: "Seconds", label: "AI Response Time", icon: Zap },
            { value: "Google", label: "& Yelp Integration", icon: Globe },
            { value: "256-bit", label: "AES Encryption", icon: Shield },
            { value: "Free", label: "Plan Available", icon: CheckCircle2 },
          ].map((stat) => (
            <div key={stat.label} className="card-elevated card-padding text-center">
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-3" />
              <div className="text-3xl font-extrabold tracking-tight text-gradient">{stat.value}</div>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── What You Get ─── */}
      <section className="bg-muted/30 py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Built for local businesses
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Everything you need to manage customer reviews — nothing you don&apos;t.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {[
              {
                title: "AI That Sounds Like You",
                desc: "Set your brand voice, tone, and guardrails. Every AI-generated response stays on-brand and professional.",
                icon: MessageSquare,
              },
              {
                title: "Google & Yelp Connected",
                desc: "Pull reviews from Google Business and Yelp automatically. No copy-pasting, no switching tabs.",
                icon: Globe,
              },
              {
                title: "Secure & Private",
                desc: "Your data is protected with AES-256-GCM encryption, row-level security, and SOC-2 aligned practices.",
                icon: Shield,
              },
            ].map((t) => (
              <div key={t.title} className="card-elevated card-padding flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-5">
                  <t.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-bold mb-2">{t.title}</h4>
                <p className="text-sm text-muted-foreground max-w-xs">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="relative max-w-6xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Start free. Upgrade when you&apos;re ready. No hidden fees.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto stagger-children">
          {[
            {
              name: "Free",
              price: "$0",
              desc: "Try it out — no credit card required",
              features: ["50 reviews/month", "20 AI replies", "1 location", "Basic analytics"],
            },
            {
              name: "Starter",
              price: "$39",
              period: "/month",
              desc: "Perfect for small businesses",
              features: ["200 reviews/month", "100 AI replies", "1 location", "Full analytics", "CSV import", "Email support"],
              popular: true,
            },
            {
              name: "Growth",
              price: "$79",
              period: "/month",
              desc: "For growing multi-location brands",
              features: ["500 reviews/month", "250 AI replies", "3 locations", "Full analytics", "Priority support"],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col card-padding rounded-2xl transition-all duration-300 ${
                plan.popular
                  ? "card-glow bg-card shadow-xl scale-[1.03] z-10"
                  : "card-elevated hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 btn-gradient text-xs font-semibold px-4 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h4 className="font-bold text-lg">{plan.name}</h4>
                <div className="mt-3 mb-2">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block mt-auto">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className={`w-full h-11 rounded-xl font-semibold ${
                    plan.popular ? "btn-gradient border-0" : ""
                  }`}
                >
                  {plan.popular ? "Start Free Trial" : "Get Started"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          Need more? We offer <strong>Pro</strong> ($149/mo) and <strong>Agency</strong> ($299/mo) plans.{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">See all plans →</Link>
        </p>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[oklch(0.40_0.22_280)]" />
        <div className="absolute inset-0 bg-dots opacity-10" />
        {/* Glow orbs */}
        <div className="absolute top-10 left-[20%] w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-10 right-[15%] w-80 h-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 md:px-8 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Ready to respond smarter?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto">
            Start managing your reviews smarter with AI-powered responses — free plan available.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              variant="secondary"
              className="h-13 px-10 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-white/50 text-sm mt-6">
            No credit card required · Free plan available forever
          </p>
        </div>
      </section>
    </div>
  );
}
