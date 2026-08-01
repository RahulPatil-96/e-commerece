import { Link } from 'react-router-dom';
import PageMeta from '@/components/PageMeta';
import { ShieldCheck, Mail, Lock, Eye } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <PageMeta title="Privacy Policy" description="How Arihant Stationery collects, uses, and protects your personal information." />

      <div className="mb-10 pb-6 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="w-6 h-6 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Legal</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" /> 1. Information We Collect
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you use the Arihant store, we collect the following categories of information:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li><strong className="text-foreground">Account information</strong> — name, email address, phone number, and (optionally) a password hash or Google OAuth identifier when you register.</li>
            <li><strong className="text-foreground">Order information</strong> — shipping address, city, state, pincode, order items, and payment status for fulfilling your purchases.</li>
            <li><strong className="text-foreground">Personalisation data</strong> — text, fonts, and colours you choose when personalising products or building gift boxes.</li>
            <li><strong className="text-foreground">Technical data</strong> — IP address, browser type, and pages visited, used for security and to improve our site.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" /> 2. How We Use Your Information
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>Process and deliver your orders, including sending order confirmations and tracking updates.</li>
            <li>Manage your account, wishlist, reviews, and B2B/wholesale inquiries.</li>
            <li>Send you service emails (order updates, password resets, verification codes).</li>
            <li>Send marketing communications only if you have subscribed to our newsletter.</li>
            <li>Detect and prevent fraud, abuse, or security incidents.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">3. Payments & Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not store full card numbers. Online payments are processed by trusted third-party payment
            gateways (such as Razorpay) that are PCI-DSS compliant. When you pay by Cash on Delivery (COD),
            no electronic payment details are collected.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Passwords are stored using one-way salted hashes (bcrypt). JWT tokens are used for authentication
            and are stored only on your device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">4. Sharing of Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell your personal data. We share information only with service providers who help us run
            the store — for example, email delivery services, payment gateways, and shipping carriers — and only
            to the extent necessary to provide their services. We may disclose information where required by law
            or to protect the rights and safety of our users and company.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">5. Your Rights</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <li>Access, correct, or update your account details at any time.</li>
            <li>Delete your account (and associated personal data) through the account settings.</li>
            <li>Unsubscribe from marketing emails using the link in any newsletter email.</li>
            <li>Request a copy or deletion of your data by contacting us (subject to legal retention requirements).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">6. Cookies & Analytics</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use essential cookies to keep you signed in and to remember your cart. We may use lightweight
            analytics to understand aggregate site usage. We do not use third-party advertising cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-display font-medium">7. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have questions about this policy or your personal data, please reach out to our team at{' '}
            <a href="mailto:hello@arihant.co" className="text-accent hover:underline">hello@arihant.co</a>.
          </p>
        </section>

        <div className="pt-6 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          hello@arihant.co · Arihant & Co., Bengaluru, India
        </div>
      </div>

      <Link to="/" className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-10">
        ← Back to Home
      </Link>
    </div>
  );
}

