import { useEffect, useState, useMemo } from 'react';
import { Shield, Trash2, Loader2, AlertCircle, Plus, X, Search } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {string} role
 * @property {boolean} is_verified
 * @property {string} created_at
 */

export default function UsersManager() {
  /** @type {[User[], import('react').Dispatch<import('react').SetStateAction<User[]>>]} */
  const [users, setUsers] = useState(/** @type {User[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** @type {[User | null, import('react').Dispatch<import('react').SetStateAction<User | null>>]} */
  const [deleteTarget, setDeleteTarget] = useState(/** @type {User | null} */ (null));
  const [deleting, setDeleting] = useState(false);
  /** @type {[number | null, import('react').Dispatch<import('react').SetStateAction<number | null>>]} */
  const [updatingRole, setUpdatingRole] = useState(/** @type {number | null} */ (null));
  const [modalOpen, setModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      // Status filter
      if (statusFilter === 'verified' && !u.is_verified) return false;
      if (statusFilter === 'pending' && u.is_verified) return false;
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const haystack = [String(u.id), u.email, u.role].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const hasActiveFilters = search.trim() !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const filterSelectClass = 'px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent';

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(/** @type {React.FormEvent} */ e) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.entities.User.create({ email: newEmail, password: newPassword, role: newRole });
      toast({ title: 'User created successfully' });
      setModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      loadUsers();
    } catch (/** @type {any} */ err) {
      toast({ title: 'Failed to create user', description: err.message || 'Error creating user', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const data = /** @type {User[]} */ (await apiClient.entities.User.list());
      setUsers(data);
    } catch (/** @type {any} */ err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  /**
   * @param {number} userId
   * @param {string} newRole
   */
  async function handleRoleChange(userId, newRole) {
    setUpdatingRole(userId);
    try {
      const updated = /** @type {{ role: string }} */ (await apiClient.entities.User.updateRole(userId, newRole));
      setUsers((prev) => prev.map((/** @type {User} */ u) => (String(u.id) === String(userId) ? { ...u, role: updated.role } : u)));
      toast({
        title: 'Role updated',
        description: `User role changed to ${newRole}`,
      });
    } catch (/** @type {any} */ err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.entities.User.delete(deleteTarget.id);
      setUsers((prev) => prev.filter((/** @type {User} */ u) => String(u.id) !== String(deleteTarget.id)));
      toast({
        title: 'User deleted',
        description: `${deleteTarget.email} has been removed.`,
      });
    } catch (/** @type {any} */ err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={loadUsers} className="text-sm text-accent hover:underline mt-2">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium">Manage Users</h2>
          <p className="text-sm text-muted-foreground">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Search + Filters Toolbar */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, email or role..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {users.length === 0 ? 'No users found.' : 'No users match your search / filters.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">#{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-3.5 h-3.5 ${user.role === 'admin' ? 'text-accent' : 'text-muted-foreground'}`} />
                        <select
                          value={user.role}
                          disabled={updatingRole === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 ${user.role === 'admin' ? 'text-accent font-medium' : 'text-foreground'}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        {updatingRole === user.id && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_verified ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Verified</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                            aria-label="Delete user"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{deleteTarget?.email}</strong>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              disabled={deleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-background border border-border rounded-sm w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-medium">Create New User</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-border py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
