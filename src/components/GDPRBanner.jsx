import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function GDPRBanner() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const gdprConsent = localStorage.getItem('gdpr-consent');
    if (!gdprConsent) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gdpr-consent', JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setAccepted(true);
  };

  const handleDismiss = () => {
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50 animate-in slide-in-from-bottom">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">Privacy & Cookies</h3>
          <p className="text-sm text-muted-foreground">
            We use cookies and similar technologies to enhance your experience, analyze traffic, and personalize content.
            <a href="/privacy" className="text-accent hover:underline ml-1">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-sm font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
