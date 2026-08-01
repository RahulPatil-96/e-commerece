import { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

/**
 * Newsletter signup component with email integration.
 * Connects to the SMTP-backed newsletter subscription API.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await apiClient.newsletter.subscribe(trimmedEmail);
      setStatus('success');
      setMessage(response?.message || 'Successfully subscribed! Check your inbox for updates.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error' || status === 'success') {
                setStatus('idle');
                setMessage('');
              }
            }}
            placeholder="Enter your email"
            required
            disabled={status === 'loading'}
            className="w-full pl-10 pr-4 py-3 rounded-full bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Subscribe</span>
        </button>
      </form>

      {message && (
        <div className={`mt-3 flex items-center gap-2 text-xs ${
          status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
        }`}>
          {status === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
}
