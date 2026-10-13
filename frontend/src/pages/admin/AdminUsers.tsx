// src/pages/admin/AdminUsers.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SearchBar } from '@/components/common/SearchBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/users?limit=100');
      setUsers(res.data?.data || []);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/user/${id}`, { isActive: !currentStatus });
      toast.success('User status updated');
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
      );
    } catch {
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' || u.role?.toUpperCase() === roleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          User Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Registered Users & Personnel
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review accounts across patients, physicians, community volunteers, and administrators.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchBar
          value={search}
          onSearch={setSearch}
          placeholder="Search by name or email..."
          className="max-w-md"
        />

        {/* Role Filters */}
        <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
          {['ALL', 'PATIENT', 'DOCTOR', 'VOLUNTEER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card className="p-6">
          <SkeletonLoader.CardSkeleton />
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  No users found matching current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'User';
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {fullName}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.role === 'ADMIN'
                            ? 'danger'
                            : u.role === 'DOCTOR'
                            ? 'primary'
                            : u.role === 'VOLUNTEER'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{u.phone || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          u.isActive !== false ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {u.isActive !== false ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={u.isActive !== false ? 'ghost' : 'outline'}
                        onClick={() => handleToggleStatus(u.id, u.isActive !== false)}
                      >
                        {u.isActive !== false ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminUsers;

