import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';

export default function GiftFinderCTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="relative overflow-hidden rounded-sm bg-primary text-primary-foreground p-10 md:p-16 text-center">
        <div className="relative z-10 max-w-lg mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
            <Sparkles className="w-4 h-4" /> Gift Finder
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-light leading-[1.1] tracking-tight">
            Find the perfect gift<br />in under a minute
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed text-base font-light">
            Tell us who it's for, the occasion, and your budget — we'll curate personalized picks just for you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to="/gift-builder" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent/90 transition-colors group">
              <Wand2 className="w-4 h-4" /> Build a Gift Box
            </Link>
            <Link to="/shop" className="inline-flex items-center gap-2 border border-primary-foreground/30 px-7 py-3.5 rounded-full text-sm font-medium hover:bg-primary-foreground/10 transition-colors">
              Personalize Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}