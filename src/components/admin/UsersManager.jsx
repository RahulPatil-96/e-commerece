import { useEffect, useState, useMemo } from 'react';
import { Trash2, Plus, X, Search, UserCheck } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirm, setConfirm] = useState(/** @type {null | { type: 'role' | 'verify' | 'delete', user: any, nextRole?: string }} */ (null));
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.entities.User.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.entities.User.create({ email: newEmail, password: newPassword, role: newRole });
      toast({ title: 'User account created successfully' });
      setModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      loadUsers();
    } catch (err) {
      toast({ title: 'Failed to create user', description: err instanceof Error ? err.message : 'Error creating user', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

const handleRoleToggle = (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirm({ type: 'role', user, nextRole });
  };

  const handleVerifyUser = (user) => {
    setConfirm({ type: 'verify', user });
  };

  const handleDeleteUser = (user) => {
    setConfirm({ type: 'delete', user });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    const { type, user, nextRole } = confirm;
    try {
if (type === 'role') {
        await apiClient.entities.User.updateRole(user.id, nextRole || 'user');
        toast({ title: `Role updated to ${nextRole}` });
      } else if (type === 'verify') {
        await apiClient.entities.User.verify(user.id);
        toast({ title: 'User verified', description: `${user.email} is now verified.` });
      } else if (type === 'delete') {
        await apiClient.entities.User.delete(user.id);
        toast({ title: 'User deleted' });
      }
loadUsers();
      setConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: type === 'verify' ? 'Failed to verify user' : type === 'delete' ? 'Failed to delete user' : 'Failed to update user role',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'verified' && !u.is_verified) return false;
      if (statusFilter === 'pending' && u.is_verified) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const haystack = [String(u.id), u.email, u.role].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary animate-pulse rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by email..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent shadow-soft"
          />
        </div>

<div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="user">Customers</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all shadow-lift"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-x-auto border border-border/80 rounded-3xl bg-card shadow-soft">
        <table className="w-full text-xs min-w-[700px]">
          <thead className="bg-secondary/60 border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <tr>
              <th className="text-left px-5 py-4">Account Email</th>
              <th className="text-left px-5 py-4">System Role</th>
              <th className="text-left px-5 py-4">Verification</th>
              <th className="text-left px-5 py-4">Created Date</th>
              <th className="text-center px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-4 font-bold text-foreground">{u.email}</td>
                <td className="px-5 py-4">
<button
                    onClick={() => handleRoleToggle(u)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
                      u.role === 'admin'
                        ? 'bg-accent-soft text-accent border-accent/30'
                        : 'bg-secondary text-muted-foreground border-border/60'
                    }`}
                  >
                    {u.role}
                  </button>
                </td>
<td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${u.is_verified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    <UserCheck className="w-3.5 h-3.5" /> {u.is_verified ? 'Verified' : 'Pending'}
                  </span>
                  {!u.is_verified && (
                    <button
                      onClick={() => handleVerifyUser(u)}
                      className="mt-1.5 block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-accent/40 text-accent hover:bg-accent-soft transition-colors"
                    >
                      Verify Now
                    </button>
                  )}
                </td>
                <td className="px-5 py-4 text-muted-foreground font-medium">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-5 py-4 text-center">
                  <button onClick={() => handleDeleteUser(u)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

{/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="relative bg-card border border-border/80 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="font-serif-display text-xl font-bold">Register New Account</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Email Address *</label>
                <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Temporary Password *</label>
                <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

<div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">System Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Customer</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-border/80 py-3 rounded-full font-semibold">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:bg-accent">{creating ? 'Creating...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branded Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.type === 'delete'
            ? 'Delete User'
            : confirm?.type === 'verify'
              ? 'Verify User'
              : confirm?.type === 'role'
                ? (confirm?.nextRole === 'admin' ? 'Promote to Administrator' : 'Demote to Customer')
                : 'Confirm Action'
        }
        description={
          confirm?.type === 'delete'
            ? `Are you sure you want to permanently delete ${confirm.user.email}? This action cannot be undone.`
            : confirm?.type === 'verify'
              ? `Verify ${confirm.user.email} and bypass email verification?`
              : confirm?.type === 'role'
                ? `Are you sure you want to ${confirm?.nextRole === 'admin' ? 'promote' : 'demote'} ${confirm.user.email}?`
                : ''
        }
        confirmLabel={
          confirm?.type === 'delete'
            ? 'Delete'
            : confirm?.type === 'verify'
              ? 'Verify'
              : confirm?.type === 'role'
                ? (confirm?.nextRole === 'admin' ? 'Promote' : 'Demote')
                : 'Confirm'
        }
        destructive={confirm?.type === 'delete'}
        loading={confirmLoading}
        onConfirm={runConfirm}
      />
    </div>
  );
}
