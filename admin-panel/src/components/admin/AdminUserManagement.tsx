'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import {
  UserPlus,
  Edit,
  Search,
  Shield,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  permissions?: string[];
  ip_whitelist?: string[];
}

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'support', label: 'Support Agent' },
  { value: 'finance', label: 'Finance Manager' },
];

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [createData, setCreateData] = useState({
    email: '',
    password: '',
    role: '',
    first_name: '',
    last_name: '',
    require_2fa: false,
    permissions: [] as string[],
    ip_whitelist: [] as string[],
  });
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    loadAdminUsers();
  }, [roleFilter]);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllAdminUsers({
        role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined,
      });
      if (response.success) {
        setAdminUsers(response.data.admins || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = adminUsers.filter((admin) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        admin.email.toLowerCase().includes(query) ||
        admin.first_name?.toLowerCase().includes(query) ||
        admin.last_name?.toLowerCase().includes(query) ||
        admin.role.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleCreateAdmin = async () => {
    if (!createData.email || !createData.password || !createData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await adminService.createAdminUser(createData);
      if (response.success) {
        toast.success('Admin user created');
        setShowCreateModal(false);
        setCreateData({
          email: '',
          password: '',
          role: '',
          first_name: '',
          last_name: '',
          require_2fa: false,
          permissions: [],
          ip_whitelist: [],
        });
        loadAdminUsers();
      } else {
        toast.error(response.message || 'Failed to create admin user');
      }
    } catch (error: any) {
      toast.error('Failed to create admin user');
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditData({
      role: admin.role,
      permissions: admin.permissions || [],
      require_2fa: admin.two_factor_enabled,
      ip_whitelist: admin.ip_whitelist || [],
      is_active: admin.is_active,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAdmin) return;

    try {
      const response = await adminService.updateAdminUser(selectedAdmin.id, editData);
      if (response.success) {
        toast.success('Admin user updated');
        setShowEditModal(false);
        setSelectedAdmin(null);
        loadAdminUsers();
      } else {
        toast.error(response.message || 'Failed to update admin user');
      }
    } catch (error: any) {
      toast.error('Failed to update admin user');
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin User Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage admin users, roles, and permissions
          </p>
        </div>
        {user?.role_code === 'SUPER' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Admin User
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ADMIN_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Admin Users Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">MFA</TableHead>
                <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(admin.first_name, admin.last_name, admin.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {admin.first_name && admin.last_name
                              ? `${admin.first_name} ${admin.last_name}`
                              : admin.email}
                          </p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ADMIN_ROLES.find((r) => r.value === admin.role)?.label ||
                          admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-500">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {admin.two_factor_enabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {admin.last_login_at
                        ? format(new Date(admin.last_login_at), 'MMM dd, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {admin.created_at
                        ? format(new Date(admin.created_at), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAdmin(admin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Navigate to activity logs filtered by this admin
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>
              Create a new admin user with role and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={createData.first_name}
                  onChange={(e) =>
                    setCreateData({ ...createData, first_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={createData.last_name}
                  onChange={(e) =>
                    setCreateData({ ...createData, last_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={createData.email}
                onChange={(e) =>
                  setCreateData({ ...createData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={createData.password}
                onChange={(e) =>
                  setCreateData({ ...createData, password: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={createData.role}
                onValueChange={(value) =>
                  setCreateData({ ...createData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.filter(
                    (r) => r.value !== 'super_admin' || user?.role_code === 'SUPER'
                  ).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="require_2fa"
                checked={createData.require_2fa}
                onCheckedChange={(checked) =>
                  setCreateData({ ...createData, require_2fa: checked as boolean })
                }
              />
              <Label htmlFor="require_2fa" className="cursor-pointer">
                Require MFA
              </Label>
            </div>
            <div>
              <Label>IP Whitelist (comma-separated)</Label>
              <Input
                placeholder="192.168.1.1, 10.0.0.1"
                value={createData.ip_whitelist.join(', ')}
                onChange={(e) =>
                  setCreateData({
                    ...createData,
                    ip_whitelist: e.target.value
                      .split(',')
                      .map((ip) => ip.trim())
                      .filter((ip) => ip),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setCreateData({
                  email: '',
                  password: '',
                  role: '',
                  first_name: '',
                  last_name: '',
                  require_2fa: false,
                  permissions: [],
                  ip_whitelist: [],
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={
                !createData.email || !createData.password || !createData.role
              }
            >
              Create Admin User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update admin user role, permissions, and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email</Label>
              <Input value={selectedAdmin?.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="edit_role">Role *</Label>
              <Select
                value={editData.role}
                onValueChange={(value) =>
                  setEditData({ ...editData, role: value })
                }
              >
                <SelectTrigger id="edit_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.filter(
                    (r) => r.value !== 'super_admin' || user?.role_code === 'SUPER'
                  ).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit_require_2fa"
                checked={editData.require_2fa}
                onCheckedChange={(checked) =>
                  setEditData({ ...editData, require_2fa: checked as boolean })
                }
              />
              <Label htmlFor="edit_require_2fa" className="cursor-pointer">
                Require 2FA
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit_is_active"
                checked={editData.is_active}
                onCheckedChange={(checked) =>
                  setEditData({ ...editData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="edit_is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div>
              <Label>IP Whitelist (comma-separated)</Label>
              <Input
                placeholder="192.168.1.1, 10.0.0.1"
                value={(editData.ip_whitelist || []).join(', ')}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    ip_whitelist: e.target.value
                      .split(',')
                      .map((ip) => ip.trim())
                      .filter((ip) => ip),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


