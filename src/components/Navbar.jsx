import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, Package, LayoutDashboard, UserCircle, Sparkles, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/AuthContext';
import { isSoundEnabled, toggleSound } from '@/lib/soundEffects';
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
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const { count, mode, setMode } = useCart();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
  const showAnnouncement = !scrolled;

  return (
    <>
      {/* Top Announcement Bar */}
      <div className={`bg-primary text-primary-foreground border-b border-white/10 overflow-hidden transition-all duration-500 ${showAnnouncement ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-xs md:text-[13px] tracking-wide font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="truncate">Complimentary Express Shipping on Orders Over ₹999 · Use code <span className="text-accent font-semibold">ARIHANT10</span></span>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-0.5 text-accent font-semibold hover:underline shrink-0 ml-1">
            Shop Collection <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Floating Translucent Header */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between px-5 md:px-7 rounded-3xl transition-all duration-500 ${scrolled ? 'glass shadow-lift py-3' : 'bg-background/80 backdrop-blur-md border border-border/60 py-3.5 shadow-soft'}`}>
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-accent via-[#D9B766] to-[#284B3D] flex items-center justify-center shadow-glow transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                <span className="font-serif-display text-lg font-bold text-white">A</span>
              </span>
              <div className="flex flex-col">
                <span className="font-serif-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Arihant<span className="text-accent font-sans">.</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-semibold -mt-1 hidden sm:block">
                  Luxury Stationery
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-9">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative text-xs lg:text-sm font-medium tracking-wide uppercase transition-colors group py-2 ${
                      active ? 'text-accent font-semibold' : 'text-foreground/80 hover:text-foreground'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute left-0 -bottom-0.5 h-0.5 rounded-full bg-accent transition-all duration-300 ${
                        active ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Spotlight Search Bar */}
            <div className="hidden lg:block w-72">
              <SearchSuggestions
                onSelect={(product) => {
                  navigate(`/product/${product.id}`);
                  setOpen(false);
                }}
              />
            </div>

            {/* Actions: Mode Toggle, Cart, Account */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Retail / Wholesale Mode Toggle */}
              <div className="hidden sm:flex items-center bg-secondary rounded-full p-1 text-[11px] font-semibold border border-border/80 shadow-inner">
                <button
                  onClick={() => setMode('retail')}
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 ${
                    mode === 'retail'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Retail
                </button>
                <button
                  onClick={() => setMode('wholesale')}
                  className={`px-3 py-1.5 rounded-full transition-all duration-300 ${
                    mode === 'wholesale'
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Wholesale
                </button>
              </div>

              {/* Sound Design Toggle */}
              <button
                onClick={() => {
                  const active = toggleSound();
                  setSoundOn(active);
                }}
                className="hidden xl:flex p-2.5 rounded-full bg-secondary/80 border border-border/60 hover:bg-accent-soft hover:text-accent transition-all duration-300 shadow-soft text-foreground"
                aria-label="Toggle tactile sound"
                title={soundOn ? "Tactile Audio Active" : "Enable Tactile Audio"}
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-accent" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Cart Drawer Icon */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-full bg-secondary/80 border border-border/60 hover:bg-accent-soft hover:text-accent hover:border-accent/40 transition-all duration-300 shadow-soft"
                aria-label="Cart"
                data-cursor-text="Cart"
              >
                <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-glow animate-scale-in">
                    {count}
                  </span>
                )}
              </Link>

              {/* User Account Menu */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-0.5 rounded-full ring-2 ring-transparent hover:ring-accent transition-all outline-none" aria-label="Account">
                      <Avatar className="w-8 h-8 md:w-9 md:h-9 shadow-soft">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 rounded-3xl p-2 shadow-lift bg-card border-border/80">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold truncate text-foreground">{user.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="my-1 bg-border/60" />
                    <DropdownMenuItem onClick={() => navigate('/cart')} className="cursor-pointer rounded-2xl p-2.5 text-xs font-medium">
                      <ShoppingBag className="w-4 h-4 mr-2.5 text-accent" />
                      My Cart {count > 0 ? `(${count})` : ''}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer rounded-2xl p-2.5 text-xs font-medium">
                      <UserCircle className="w-4 h-4 mr-2.5 text-accent" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer rounded-2xl p-2.5 text-xs font-medium">
                      <Package className="w-4 h-4 mr-2.5 text-accent" />
                      My Orders
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer rounded-2xl p-2.5 text-xs font-medium">
                          <LayoutDashboard className="w-4 h-4 mr-2.5 text-accent" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="my-1 bg-border/60" />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive rounded-2xl p-2.5 text-xs font-medium">
                      <LogOut className="w-4 h-4 mr-2.5" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={navigateToLogin}
                  className="p-2.5 rounded-full bg-secondary/80 border border-border/60 hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-soft"
                  aria-label="Sign in"
                >
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}

              {/* Mobile Menu Trigger */}
              <button
                className="md:hidden p-2.5 rounded-full bg-secondary border border-border/60 hover:bg-accent-soft transition-colors"
                onClick={() => setOpen(!open)}
                aria-label="Menu"
              >
                {open ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-card shadow-lift animate-slide-in-right flex flex-col border-l border-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-20 border-b border-border/60">
              <span className="font-serif-display text-2xl font-bold">Arihant<span className="text-accent">.</span></span>
              <button onClick={() => setOpen(false)} className="p-2.5 rounded-full bg-secondary hover:bg-accent-soft" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 pt-5">
              <SearchSuggestions
                onSelect={(product) => {
                  navigate(`/product/${product.id}`);
                  setOpen(false);
                }}
              />
            </div>

            <nav className="px-6 py-6 space-y-2 flex-1 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-5 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                    location.pathname === link.path ? 'bg-accent text-accent-foreground font-semibold shadow-soft' : 'text-foreground/80 hover:bg-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-6 border-t border-border/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Pricing Mode</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMode('retail')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all ${
                      mode === 'retail' ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    Retail Mode
                  </button>
                  <button
                    onClick={() => setMode('wholesale')}
                    className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all ${
                      mode === 'wholesale' ? 'bg-accent text-accent-foreground shadow-soft' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    Wholesale Mode
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
