import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SwiftReview Pro",
  description: "How SwiftReview Pro collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: March 15, 2026
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold mb-3">1. Information We Collect</h2>
          <p>
            <strong>Account information:</strong> When you sign up, we collect
            your name, email address, and password — or your Google account
            identifier if you use &ldquo;Sign in with Google.&rdquo;
          </p>
          <p className="mt-2">
            <strong>Business information:</strong> During onboarding you provide
            your business name, location, industry, and brand-voice preferences.
          </p>
          <p className="mt-2">
            <strong>Review data:</strong> We access reviews from platforms you
            connect (Google Business Profile, Yelp) through their official APIs
            using OAuth tokens you authorize.
          </p>
          <p className="mt-2">
            <strong>Payment information:</strong> Billing is processed by Stripe.
            We store your Stripe customer ID and subscription status but{" "}
            <strong>never</strong> store credit card numbers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To provide the SwiftReview Pro service, including AI-generated review replies</li>
            <li>To import and display your reviews from connected platforms</li>
            <li>To post replies on your behalf when you choose auto-post</li>
            <li>To process payments and manage your subscription</li>
            <li>To send transactional emails (confirmation, billing receipts)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">3. AI-Generated Content</h2>
          <p>
            We use OpenAI&rsquo;s API to generate review-reply suggestions. Your
            review text and brand-voice settings are sent to OpenAI for
            processing. OpenAI does not use API inputs for model training. You are
            responsible for reviewing and approving all AI-generated content
            before posting.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">4. Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase</strong> — Database &amp; authentication hosting</li>
            <li><strong>Stripe</strong> — Payment processing</li>
            <li><strong>OpenAI</strong> — AI content generation</li>
            <li><strong>Google Business Profile API</strong> — Review import &amp; reply posting</li>
            <li><strong>Yelp Fusion API</strong> — Review import</li>
            <li><strong>Vercel</strong> — Application hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">5. Data Security</h2>
          <p>
            OAuth tokens are encrypted at rest using AES-256-GCM. All data is
            transmitted over HTTPS. We use row-level security policies to isolate
            organization data in our database.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. Upon
            account deletion we remove your personal data, reviews, and
            integration credentials within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">7. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal data at any time by contacting{" "}
            <a href="mailto:support@swiftreviewpro.com" className="text-primary hover:underline">
              support@swiftreviewpro.com
            </a>
            . If you are in the EU you have additional rights under GDPR
            including data portability.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">8. Cookies</h2>
          <p>
            We use essential cookies for authentication sessions. We do not use
            tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. We will notify you of
            material changes via email or in-app notification.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">10. Contact</h2>
          <p>
            For privacy questions, contact us at{" "}
            <a href="mailto:support@swiftreviewpro.com" className="text-primary hover:underline">
              support@swiftreviewpro.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
