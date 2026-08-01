import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Handles the redirect back from the Google OAuth provider.
 * The backend appends ?access_token=...&user=... to the FRONTEND_URL.
 * We store the token, load the user, and navigate to the intended page.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get('access_token');
    const userParam = searchParams.get('user');
    const oauthError = searchParams.get('oauth_error');

    const redirectTo = (() => {
      try {
        return localStorage.getItem('arihant_oauth_redirect') || '/';
      } catch {
        return '/';
      }
    })();

    const fail = (message = '') => {
      // Surface the error as a query param the login page can read
      navigate(`/login?oauth_error=${encodeURIComponent(message || 'Google sign-in failed')}`, { replace: true });
    };

    if (oauthError) {
      fail('Google sign-in was cancelled or failed. Please try again.');
      return;
    }

    if (!accessToken) {
      fail('No access token returned from Google sign-in.');
      return;
    }

    // Persist token
    apiClient.auth.setToken(accessToken);

    // If backend already returned user data, seed it directly
    if (userParam) {
      try {
        const parsedUser = JSON.parse(userParam);
        localStorage.setItem('arihant_user_cache', JSON.stringify(parsedUser));
      } catch {
        // Ignore malformed user param
      }
    }

    // Clear the stored redirect target
    try {
      localStorage.removeItem('arihant_oauth_redirect');
    } catch {
      // Ignore
    }

    // Refresh auth context state
    checkUserAuth()
      .then(() => {
        navigate(redirectTo, { replace: true });
      })
      .catch(() => {
        // Even if checkUserAuth fails, the token is set — allow navigation
        navigate(redirectTo, { replace: true });
      });
  }, [navigate, searchParams, checkUserAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <h1 className="font-display text-2xl font-medium mb-1">Completing sign in…</h1>
      <p className="text-sm text-muted-foreground">Linking your Google account with Arihant.</p>
    </div>
  );
}

