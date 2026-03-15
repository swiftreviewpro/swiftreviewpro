import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | SwiftReview Pro",
  description: "Terms governing your use of the SwiftReview Pro service.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: March 15, 2026
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using SwiftReview Pro (&ldquo;the Service&rdquo;),
            you agree to be bound by these Terms of Service. If you do not agree,
            do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">2. Description of Service</h2>
          <p>
            SwiftReview Pro is a review management platform that helps businesses
            import customer reviews from connected platforms and generate
            AI-powered reply suggestions. The Service includes review monitoring,
            AI reply generation, and optional auto-posting of replies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">3. Account Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate account information</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You are responsible for all activity under your account</li>
            <li>You must be at least 18 years old to use the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">4. AI-Generated Content Disclaimer</h2>
          <p>
            AI-generated reply suggestions are provided as drafts only.{" "}
            <strong>
              You are solely responsible for reviewing, editing, and approving all
              content before it is posted publicly.
            </strong>{" "}
            SwiftReview Pro is not liable for any consequences of AI-generated
            content that you choose to publish.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">5. Platform Integrations</h2>
          <p>
            By connecting third-party accounts (Google Business Profile, Yelp),
            you authorize SwiftReview Pro to access your reviews and, when
            explicitly requested, post replies on your behalf. You may disconnect
            integrations at any time from the Locations page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">6. Subscription &amp; Billing</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Free accounts are limited to 3 AI-generated replies total</li>
            <li>Paid subscriptions are billed monthly via Stripe</li>
            <li>You may cancel at any time; access continues until the end of the billing period</li>
            <li>Refunds are not provided for partial billing periods</li>
            <li>We reserve the right to change pricing with 30 days&rsquo; notice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Use the Service to generate fake, misleading, or defamatory reviews or replies</li>
            <li>Violate the terms of service of connected platforms (Google, Yelp)</li>
            <li>Attempt to access other users&rsquo; data or organizations</li>
            <li>Reverse-engineer, scrape, or abuse the Service or its APIs</li>
            <li>Use the Service for any illegal purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">8. Data Ownership</h2>
          <p>
            You retain ownership of your business data and review content. You
            grant SwiftReview Pro a limited license to process your data solely
            for providing the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">9. Limitation of Liability</h2>
          <p>
            SwiftReview Pro is provided &ldquo;as is&rdquo; without warranties of
            any kind. We are not liable for indirect, incidental, or
            consequential damages. Our total liability shall not exceed the amount
            you paid in the 12 months preceding any claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">10. Termination</h2>
          <p>
            We may suspend or terminate your account for violation of these terms.
            You may cancel your subscription or delete your account at any time by
            visiting the Billing page or contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">11. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the
            Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">12. Contact</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:support@swiftreviewpro.com" className="text-primary hover:underline">
              support@swiftreviewpro.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
