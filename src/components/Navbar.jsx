import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/AuthContext';
import SearchSuggestions from '@/components/SearchSuggestions';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, mode, setMode } = useCart();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const navLinks = [
    { label: 'Shop', path: '/shop' },
    { label: 'Gift Builder', path: '/gift-builder' },
    { label: 'B2B / Wholesale', path: '/b2b' },
    { label: 'About', path: '/about' },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-md shadow-sm' : 'bg-background'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-2xl md:text-3xl font-medium tracking-tight">Arihant<span className="text-accent">.</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-accent ${location.pathname === link.path ? 'text-accent' : 'text-foreground/80'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop search with autocomplete suggestions */}
          <div className="hidden lg:block w-64">
            <SearchSuggestions
              onSelect={(product) => {
                navigate(`/product/${product.id}`);
                setOpen(false);
              }}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mode toggle */}
            <div className="hidden sm:flex items-center bg-secondary rounded-full p-0.5 text-xs font-medium">
              <button
                onClick={() => setMode('retail')}
                className={`px-3 py-1.5 rounded-full transition-all ${mode === 'retail' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Retail
              </button>
              <button
                onClick={() => setMode('wholesale')}
                className={`px-3 py-1.5 rounded-full transition-all ${mode === 'wholesale' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Wholesale
              </button>
            </div>

            <Link to="/cart" className="relative p-2 hover:text-accent transition-colors" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            {/* Profile icon */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-0.5 rounded-full hover:ring-2 hover:ring-accent transition-all outline-none" aria-label="Account">
                    <Avatar className="w-8 h-8">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                      ) : (
                        <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/cart')} className="cursor-pointer">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    My Cart {count > 0 ? `(${count})` : ''}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button onClick={navigateToLogin} className="p-2 hover:text-accent transition-colors" aria-label="Sign in">
                <User className="w-5 h-5" />
              </button>
            )}

            <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="px-4 pt-4">
            <SearchSuggestions
              onSelect={(product) => {
                navigate(`/product/${product.id}`);
                setOpen(false);
              }}
            />
          </div>
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className="block py-2.5 text-sm font-medium text-foreground/80 hover:text-accent">
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={() => setMode('retail')}
                className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${mode === 'retail' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                Retail
              </button>
              <button
                onClick={() => setMode('wholesale')}
                className={`flex-1 py-2 rounded-full text-xs font-medium transition-all ${mode === 'wholesale' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                Wholesale
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}