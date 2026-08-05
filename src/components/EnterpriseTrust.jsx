import { ShieldCheck, FileText, Award, UserCheck, Truck, Lock } from 'lucide-react';
import Reveal from './Reveal';

export default function EnterpriseTrust() {
  const trustFeatures = [
    { icon: FileText, title: 'GST Compliant Invoicing', desc: 'Instant tax invoice generation with input tax credit for corporate entities.' },
    { icon: ShieldCheck, title: 'ISO 9001 Quality Assured', desc: 'Archival grade acid-free paper and precision laser etching standards.' },
    { icon: UserCheck, title: 'Dedicated Account Manager', desc: 'Direct WhatsApp & phone line with a senior corporate gifting strategist.' },
    { icon: Truck, title: 'Nationwide Multi-Desk Delivery', desc: 'White-glove fulfillment directly to employee home addresses or regional offices.' },
    { icon: Award, title: 'PAN Verified Enterprise', desc: 'Fully compliant B2B vendor onboarded with major financial institutions.' },
    { icon: Lock, title: 'Encrypted Security', desc: 'Bank-level 256-bit SSL transaction encryption and data privacy compliance.' },
  ];

  return (
    <section className="py-20 md:py-28 bg-card border-y border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block border border-accent/20">
            Enterprise Grade Trust
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Built for Corporate Procurement</h2>
          <p className="text-muted-foreground font-light text-sm sm:text-base">
            Trusted by top tech unicorns, banking institutions, and global enterprises across India.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustFeatures.map((feat, idx) => (
            <Reveal key={idx} delay={idx * 70}>
              <div className="p-7 rounded-3xl bg-secondary/40 border border-border/70 hover:border-accent/60 transition-all duration-300 space-y-3 shadow-soft hover:shadow-card hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif-display text-lg font-bold text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">{feat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
