import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname
    .split('/')
    .filter(Boolean);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...pathSegments.map((segment, idx) => ({
      label: segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
      href: '/' + pathSegments.slice(0, idx + 1).join('/')
    }))
  ];

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length === 1) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto pb-2">
      {breadcrumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-1 whitespace-nowrap">
          {idx === 0 ? (
            <Link
              to={crumb.href}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-border" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-medium bg-secondary px-3 py-1 rounded-full">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.href}
                  className="px-2.5 py-1 rounded-full hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

