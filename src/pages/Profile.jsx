import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, Package, MapPin, KeyRound, Loader2, Save, CheckCircle2, AlertCircle, ChevronRight, ShoppingBag, LogOut, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import PageMeta from '@/components/PageMeta';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_STATES, validateShippingDetails } from '@/utils/indianValidation';

/** @typedef {{ id: number, email: string, first_name?: string, last_name?: string, phone?: string, role?: string, is_verified?: boolean, auth_provider?: string, avatar_url?: string, created_at?: string }} ProfileUser */
/** @typedef {{ id?: string | number, label?: string, full_name: string, phone: string, address: string, city: string, state: string, pincode: string, is_default?: boolean }} SavedAddress */

const DEFAULT_ADDRESS_FORM = /** @type {SavedAddress} */ ({
  label: 'Home',
  full_name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  is_default: false,
});

export default function Profile() {
  const { user, logout, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  /** @type {[ProfileUser | null, import('react').Dispatch<import('react').SetStateAction<ProfileUser | null>>]} */
  const [profile, setProfile] = useState(/** @type {ProfileUser | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwdError, setPwdError] = useState('');
  const [addresses, setAddresses] = useState(/** @type {SavedAddress[]} */ ([]));
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(/** @type {string | number | null} */ (null));
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressErrors, setAddressErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [addressForm, setAddressForm] = useState(/** @type {SavedAddress} */ (DEFAULT_ADDRESS_FORM));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClient.entities.User.getMe()
      .then(data => {
        if (!mounted) return;
        setProfile(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
        });
      })
      .catch(() => {
        if (mounted) toast({ title: 'Failed to load profile', variant: 'destructive' });
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
     
  }, []);

  useEffect(() => {
    apiClient.entities.Order.list('-created_date', 200)
      .then(data => setOrderCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setOrderCount(0))
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    apiClient.entities.User.addresses.list()
      .then(data => { if (mounted) setAddresses(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) toast({ title: 'Failed to load addresses', variant: 'destructive' }); })
      .finally(() => mounted && setAddressesLoading(false));
    return () => { mounted = false; };
     
  }, []);

  const handleSaveProfile = async (/** @type {React.FormEvent} */ e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await apiClient.entities.User.updateMe({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      });
      setProfile(updated);
      await checkUserAuth();
      toast({ title: 'Profile updated', description: 'Your information has been saved.' });
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Could not update profile', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (/** @type {React.FormEvent} */ e) => {
    e.preventDefault();
    setPwdError('');
    if (pwd.new_password.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }
    if (pwd.new_password !== pwd.confirm_password) {
      setPwdError('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.entities.User.changePassword({
        current_password: pwd.current_password,
        new_password: pwd.new_password,
      });
      toast({ title: 'Password changed', description: 'Your password has been updated successfully.' });
      setPwd({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const resetAddressForm = () => {
    setAddressForm({ ...DEFAULT_ADDRESS_FORM });
    setAddressErrors({});
    setEditingAddressId(null);
  };

  const startAddAddress = () => {
    resetAddressForm();
    setShowAddressForm(true);
  };

  const startEditAddress = (/** @type {SavedAddress} */ addr) => {
    setEditingAddressId(addr.id || null);
    setAddressForm({
      label: addr.label || 'Home',
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      is_default: Boolean(addr.is_default),
    });
    setAddressErrors({});
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (/** @type {React.FormEvent} */ e) => {
    e.preventDefault();
    setAddressErrors({});
    const validation = validateShippingDetails({
      customer_name: addressForm.full_name,
      email: profile?.email || '',
      phone: addressForm.phone,
      address: addressForm.address,
      city: addressForm.city,
      state: addressForm.state,
      pincode: addressForm.pincode,
    });
    if (!validation.valid) {
      setAddressErrors(/** @type {Record<string, string>} */ (/** @type {unknown} */ (validation.errors)));
      return;
    }
    setSavingAddress(true);
    try {
      const payload = {
        label: addressForm.label || 'Home',
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        address: addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state,
        pincode: addressForm.pincode.trim(),
        is_default: Boolean(addressForm.is_default),
      };
      if (editingAddressId !== null) {
        await apiClient.entities.User.addresses.update(editingAddressId, payload);
        toast({ title: 'Address updated', description: 'Your address has been updated.' });
      } else {
        await apiClient.entities.User.addresses.create(payload);
        toast({ title: 'Address saved', description: 'Your address has been saved.' });
      }
      const updated = await apiClient.entities.User.addresses.list();
      setAddresses(Array.isArray(updated) ? updated : []);
      setShowAddressForm(false);
      resetAddressForm();
    } catch (err) {
      toast({
        title: 'Could not save address',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (/** @type {string | number | undefined} */ id) => {
    if (!id) return;
    if (!window.confirm('Delete this address?')) return;
    try {
      await apiClient.entities.User.addresses.delete(id);
      const updated = await apiClient.entities.User.addresses.list();
      setAddresses(Array.isArray(updated) ? updated : []);
      toast({ title: 'Address deleted' });
      if (editingAddressId === id) resetAddressForm();
    } catch (err) {
      toast({
        title: 'Could not delete address',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefaultAddress = async (/** @type {string | number | undefined} */ id) => {
    if (!id) return;
    try {
      await apiClient.entities.User.addresses.setDefault(id);
      const updated = await apiClient.entities.User.addresses.list();
      setAddresses(Array.isArray(updated) ? updated : []);
      toast({ title: 'Default address updated' });
    } catch (err) {
      toast({
        title: 'Could not set default address',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email.split('@')[0]
    : (user?.name || 'User');

  const initials = (displayName || 'U').split(' ').map((/** @type {string} */ w) => w[0]).slice(0, 2).join('').toUpperCase();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const inputClass = 'w-full pl-10 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all';

  if (loading) {
    return (
<div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <PageMeta title="My Profile" description="Manage your Arihant account profile and settings." />
        <div className="h-10 bg-secondary animate-pulse rounded-md w-48 mb-8" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse p-6" />)}
        </div>
      </div>
    );
  }

  return (
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <PageMeta title="My Profile" description="View and manage your Arihant account information, profile details, and settings." />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-accent bg-accent-soft px-4 py-1.5 rounded-full">
            <User className="w-3 h-3" /> Account
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-light mt-3 tracking-tight">My Profile</h1>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm text-accent hover:underline">
          Continue Shopping <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column — Profile card + quick links */}
        <div className="space-y-6">
          {/* Identity card */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary to-primary/85 relative">
              <div className="absolute inset-0 bg-grid opacity-20" />
            </div>
            <div className="px-6 pb-6 -mt-10">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-[hsl(27_87%_60%)] flex items-center justify-center text-2xl font-bold text-white ring-4 ring-card shadow-lift">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  initials
                )}
              </div>
              <h2 className="font-display text-xl font-medium mt-4">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-soft text-accent">
                  <Shield className="w-3 h-3" /> {profile?.role === 'admin' ? 'Administrator' : 'Member'}
                </span>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-border px-6 py-4 space-y-2.5 text-sm">
              <p className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="w-4 h-4 text-accent" /> Member since {memberSince}
              </p>
              {profile?.phone && (
                <p className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="w-4 h-4 text-accent" /> {profile.phone}
                </p>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 pt-5 pb-2">Quick Links</h3>
            <div className="divide-y divide-border">
              <Link to="/orders" className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium hover:bg-secondary/50 transition-colors group">
                <Package className="w-4 h-4 text-accent" /> My Orders
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/cart" className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium hover:bg-secondary/50 transition-colors group">
                <ShoppingBag className="w-4 h-4 text-accent" /> My Cart
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </div>
        </div>

        {/* Right column — Edit profile + password + addresses + activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit profile */}
          <form onSubmit={handleSaveProfile} className="bg-card rounded-2xl border border-border/60 shadow-soft p-6 space-y-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              <h2 className="font-display text-lg font-medium">Personal Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="First name"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Last name"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={inputClass}
                />
              </div>
              {form.phone && form.phone.length !== 10 && (
                <p className="text-[11px] text-amber-600 mt-1">Phone must be 10 digits.</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={profile?.email || ''} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed.</p>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-accent transition-all duration-300 shadow-md disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Change password */}
          <form onSubmit={handleChangePassword} className="bg-card rounded-2xl border border-border/60 shadow-soft p-6 space-y-5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-accent" />
              <h2 className="font-display text-lg font-medium">Change Password</h2>
            </div>
            {profile?.auth_provider === 'google' ? (
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl p-4">
                <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p>You signed in with Google. Password management is handled by Google.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Current Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={pwd.current_password}
                      onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
                      placeholder="Enter current password"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={pwd.new_password}
                        onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                        placeholder="Min 8 characters"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={pwd.confirm_password}
                        onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })}
                        placeholder="Re-enter new password"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
                {pwdError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {pwdError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-accent transition-all duration-300 shadow-md disabled:opacity-50"
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </>
            )}
          </form>

          {/* Saved Addresses */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg font-medium">Saved Addresses</h2>
              </div>
              {!showAddressForm && (
                <button
                  onClick={startAddAddress}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {addressesLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-secondary/50 rounded-xl animate-pulse" />)}
              </div>
            ) : addresses.length === 0 && !showAddressForm ? (
              <p className="text-sm text-muted-foreground">
                No saved addresses yet. Add one to speed up checkout.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Address list */}
                {addresses.map((addr) => (
                  <div key={addr.id} className="bg-secondary/30 rounded-xl p-4 border border-border/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{addr.label || 'Home'}</span>
                          {addr.is_default && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                              <Star className="w-2.5 h-2.5" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                          {addr.full_name}
                          {addr.phone ? ` · ${addr.phone}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditAddress(addr)}
                          className="p-1.5 hover:bg-secondary rounded-sm transition-colors text-muted-foreground hover:text-accent"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 hover:bg-secondary rounded-sm transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[10px] font-medium px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-accent hover:border-accent transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add/Edit Form */}
                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="bg-background rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {editingAddressId !== null ? 'Edit Address' : 'Add New Address'}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setShowAddressForm(false); resetAddressForm(); }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
<label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
                        <Select
                          value={addressForm.label}
                          onValueChange={(val) => setAddressForm({ ...addressForm, label: val })}
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Select label" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                        <input
                          value={addressForm.full_name}
                          onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                          placeholder="Receiver name"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {addressErrors.customer_name && <p className="text-[11px] text-destructive mt-1">{addressErrors.customer_name}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                        <input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          placeholder="10-digit mobile"
                          maxLength={10}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {addressErrors.phone && <p className="text-[11px] text-destructive mt-1">{addressErrors.phone}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                        <textarea
                          value={addressForm.address}
                          onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                          placeholder="Street, area, landmark"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                        {addressErrors.address && <p className="text-[11px] text-destructive mt-1">{addressErrors.address}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                        <input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="City"
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {addressErrors.city && <p className="text-[11px] text-destructive mt-1">{addressErrors.city}</p>}
                      </div>
                      <div>
<label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
                        <Select
                          value={addressForm.state || undefined}
                          onValueChange={(val) => setAddressForm({ ...addressForm, state: val })}
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {addressErrors.state && <p className="text-[11px] text-destructive mt-1">{addressErrors.state}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Pincode</label>
                        <input
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          placeholder="6-digit pincode"
                          maxLength={6}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {addressErrors.pincode && <p className="text-[11px] text-destructive mt-1">{addressErrors.pincode}</p>}
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="addr-default"
                          checked={Boolean(addressForm.is_default)}
                          onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                          className="w-4 h-4 accent-accent"
                        />
                        <label htmlFor="addr-default" className="text-xs text-muted-foreground">Set as default address</label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full text-xs font-medium hover:bg-accent transition-all duration-300 disabled:opacity-50"
                      >
                        {savingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingAddress ? 'Saving...' : (editingAddressId !== null ? 'Update Address' : 'Save Address')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-accent" />
              <h2 className="font-display text-lg font-medium">Your Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-2xl p-5 text-center">
                <p className="font-display text-3xl font-medium text-accent">{ordersLoading ? '—' : orderCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-5 text-center">
                <p className="font-display text-3xl font-medium text-accent">₹{orderCount > 0 ? '✓' : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Account Active</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 mt-4 text-xs text-muted-foreground bg-secondary/30 rounded-xl p-4">
              <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p>Your saved addresses appear here. They can be selected at checkout to prefill your shipping details.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

