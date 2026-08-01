import { Link } from 'react-router-dom';
import PageMeta from '@/components/PageMeta';
import { FileText, Scale, RefreshCcw, AlertTriangle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <PageMeta title="Terms of Service" description="The terms and conditions that govern your use of the Arihant Stationery store and its services." />

      <div className="mb-10 pb-6 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Legal</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" /> 1. Acceptance of Terms
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using the Arihant Stationery website and services, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the site.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">2. Account Responsibilities</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>You must provide accurate, current, and complete information when creating an account.</li>
            <li>You are responsible for safeguarding your password and any activity that occurs under your account.</li>
            <li>You must be at least 18 years old to create an account and place orders, or have parental consent.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">3. Orders & Pricing</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
            <li>We make every effort to ensure product descriptions, images, and stock levels are accurate, but errors may occur.</li>
            <li>We reserve the right to refuse or cancel orders in cases of suspected fraud, pricing errors, or stock unavailability.</li>
            <li>Order confirmation emails mark the acceptance of your order; we may still cancel it if an item cannot be fulfilled.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-accent" /> 4. Returns & Refunds
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We offer a 30-day return policy on unused, unopened products in their original packaging. Personalised
            or customised items (engraved pens, custom gift boxes, personalised notebooks) are non-returnable unless
            they arrive damaged or defective. Refunds are issued to the original payment method within 5–7 business
            days after inspection. Shipping charges on returns are borne by the customer unless the item was
            incorrect or damaged.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">5. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All content on this site — including text, graphics, logos, product images, and the Arihant brand — is
            the property of Arihant & Co. and is protected by applicable copyright and trademark laws. You may not
            reproduce, distribute, or create derivative works without our prior written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">6. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the fullest extent permitted by law, Arihant & Co. shall not be liable for any indirect, incidental,
            special, or consequential damages arising out of or in connection with your use of the site or the
            products purchased. Our total liability shall not exceed the amount paid by you for the relevant order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" /> 7. Prohibited Conduct
          </h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>Attempting to interfere with the security or operation of the site.</li>
            <li>Misusing promotional codes, discounts, or referral programs.</li>
            <li>Posting abusive, defamatory, or fraudulent reviews.</li>
            <li>Using automated tools (scrapers/bots) to access the site without permission.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">8. Governing Law</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These terms are governed by the laws of India. Any disputes arising from these terms or your use of the
            site shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">9. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at{' '}
            <a href="mailto:hello@arihant.co" className="text-accent hover:underline">hello@arihant.co</a>.
          </p>
        </section>

        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            By continuing to use this site, you acknowledge that you have read and understood these Terms of Service.
          </p>
        </div>
      </div>

      <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-10">
        ← Back to Home
      </Link>
    </div>
  );
}

