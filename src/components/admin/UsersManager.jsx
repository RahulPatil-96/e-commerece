import { useEffect, useState } from 'react';
import { Users, Shield, Trash2, Loader2, AlertCircle } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
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
    </div>
  );
}

