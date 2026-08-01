import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, Package, LayoutDashboard, UserCircle, Sparkles, ChevronRight } from 'lucide-react';
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
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const navLinks = [
    { label: 'Shop', path: '/shop' },
    // { label: 'Gift Builder', path: '/gift-builder' },
    { label: 'B2B / Wholesale', path: '/b2b' },
    { label: 'About', path: '/about' },
  ];

  const isAdmin = user?.role === 'admin';
  const showAnnouncement = !scrolled;

  return (
    <>
      {/* Announcement bar */}
      <div className={`bg-primary text-primary-foreground overflow-hidden transition-all duration-500 ${showAnnouncement ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-xs md:text-[13px] tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="truncate">Free shipping on orders above ₹999 · Extra 10% off with code <span className="font-semibold text-accent">ARIHANT10</span></span>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-0.5 text-accent font-medium hover:underline shrink-0 ml-1">
            Shop now <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-lift' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[4.5rem]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-[hsl(27_87%_60%)] flex items-center justify-center shadow-glow transition-transform duration-300 group-hover:scale-105">
                <span className="font-display text-lg font-bold text-white">A</span>
              </span>
              <span className="font-display text-xl md:text-2xl font-medium tracking-tight">Arihant<span className="text-accent">.</span></span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-9">
              {navLinks.map(link => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative text-sm font-medium tracking-wide transition-colors group py-2 ${active ? 'text-accent' : 'text-foreground/75 hover:text-foreground'}`}
                  >
                    {link.label}
                    <span className={`absolute left-0 -bottom-0.5 h-0.5 rounded-full bg-accent transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                );
              })}
            </nav>

            {/* Desktop search with autocomplete suggestions */}
            <div className="hidden lg:block w-72">
              <SearchSuggestions
                onSelect={(product) => {
                  navigate(`/product/${product.id}`);
                  setOpen(false);
                }}
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mode toggle */}
              <div className="hidden sm:flex items-center bg-secondary/80 backdrop-blur rounded-full p-1 text-xs font-medium border border-border/60">
                <button
                  onClick={() => setMode('retail')}
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 ${mode === 'retail' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Retail
                </button>
                <button
                  onClick={() => setMode('wholesale')}
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 ${mode === 'wholesale' ? 'bg-accent text-accent-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Wholesale
                </button>
              </div>

              <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-accent-soft hover:text-accent transition-all duration-300" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-accent text-accent-foreground text-[10px] font-semibold w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-glow">
                    {count}
                  </span>
                )}
              </Link>

              {/* Profile icon */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-0.5 rounded-full hover:ring-2 hover:ring-accent transition-all outline-none" aria-label="Account">
                      <Avatar className="w-8 h-8 ring-2 ring-background shadow-md">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-accent to-[hsl(27_87%_60%)] text-white text-sm font-semibold">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-lift">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/cart')} className="cursor-pointer rounded-xl">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      My Cart {count > 0 ? `(${count})` : ''}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer rounded-xl">
                      <UserCircle className="w-4 h-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer rounded-xl">
                      <Package className="w-4 h-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer rounded-xl">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive rounded-xl">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button onClick={navigateToLogin} className="p-2.5 rounded-full hover:bg-accent-soft hover:text-accent transition-all duration-300" aria-label="Sign in">
                  <User className="w-5 h-5" />
                </button>
              )}

              <button className="md:hidden p-2.5 rounded-full hover:bg-accent-soft transition-colors" onClick={() => setOpen(!open)} aria-label="Menu">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background shadow-2xl animate-slide-in-right flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 h-16 border-b border-border">
              <span className="font-display text-xl font-medium">Arihant<span className="text-accent">.</span></span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-secondary" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pt-4">
              <SearchSuggestions
                onSelect={(product) => {
                  navigate(`/product/${product.id}`);
                  setOpen(false);
                }}
              />
            </div>
            <nav className="px-5 py-4 space-y-1 flex-1 overflow-y-auto">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${location.pathname === link.path ? 'bg-accent-soft text-accent' : 'text-foreground/80 hover:bg-secondary'}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => setMode('retail')}
                  className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-all ${mode === 'retail' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground'}`}
                >
                  Retail
                </button>
                <button
                  onClick={() => setMode('wholesale')}
                  className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-all ${mode === 'wholesale' ? 'bg-accent text-accent-foreground shadow-md' : 'bg-secondary text-muted-foreground'}`}
                >
                  Wholesale
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

