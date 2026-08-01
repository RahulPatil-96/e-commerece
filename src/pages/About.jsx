import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Recycle, Heart, Award, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Image } from '@/components/ui/image';
import PageMeta from '@/components/PageMeta';

export default function About() {
  const [values, setValues] = useState(/** @type {Array<{icon: React.ElementType, title: string, desc: string}>} */([]));
  const [stats, setStats] = useState(/** @type {Array<{num: string, label: string}>} */([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.SiteContent.getAll()
      .then(data => {
        if (Array.isArray(data.about_values)) {
          setValues(data.about_values.map((/** @type {{icon: string, title: string, desc: string}} */ v) => ({
            ...v,
            icon: v.icon === 'Recycle' ? Recycle : v.icon === 'Heart' ? Heart : Award,
          })));
        }
        if (Array.isArray(data.about_stats)) {
          setStats(data.about_stats);
        }
      })
      .catch(() => {
        // Empty state handled gracefully
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageMeta title="About" description="Learn about Arihant’s craftsmanship, sustainability values, and design philosophy." />
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-medium uppercase tracking-widest text-accent">Our Story</span>
            <h1 className="font-display text-5xl md:text-6xl font-medium leading-[1.05] text-balance">
              Tools for<br />thoughtful<br /><span className="italic text-accent">work.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Arihant started with a simple frustration: beautiful stationery was either too expensive or poorly made. So we made our own.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              From a tiny studio in Indiranagar to thousands of desks across India, we've stayed true to one belief — the things you write with should make you want to write more.
            </p>
          </div>
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-secondary shadow-card">
            <Image src="https://images.unsplash.com/photo-1517842645767-c639042777db?w=700&q=80" alt="Studio" className="w-full h-full object-cover" fittingType="fill" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              <p>Stats not configured yet.</p>
            </div>
          ) : (
            stats.map((s, i) => (
              <div key={i} className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6 shadow-inner">
                <p className="font-display text-4xl md:text-5xl font-medium text-accent">{s.num}</p>
                <p className="text-sm text-primary-foreground/70 mt-1">{s.label}</p>
              </div>
            ))
          )}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-medium uppercase tracking-widest text-accent">What we stand for</span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mt-3">Our values</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : values.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              <p>About values not configured yet.</p>
            </div>
          ) : (
            values.map((v, i) => (
              <div key={i} className="bg-card border border-border/70 rounded-2xl p-8 space-y-4 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center">
                  {(() => { const Icon = v.icon; return <Icon className="w-6 h-6 text-accent" />; })()}
                </div>
                <h3 className="font-display text-xl font-medium">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <div className="bg-card border border-border/70 rounded-3xl p-10 md:p-16 text-center shadow-card">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">Ready to find your perfect notebook?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Explore our full collection of thoughtfully crafted stationery.</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors group shadow-md">
            Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}

