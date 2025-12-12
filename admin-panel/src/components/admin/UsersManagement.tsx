'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, AdminUser } from '@/src/lib/api/adminService';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  MoreVertical,
  Shield,
  ShieldOff,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Download,
  Eye,
  Edit,
  DollarSign,
  Briefcase,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserFilters, UserFilters as UserFiltersType } from './UserFilters';
import { BulkActions } from './BulkActions';
import { useRouter } from 'next/navigation';

// All available roles (including ADMIN_APP)
// USER ROLES ONLY (for regular users, not admins)
const USER_ROLES = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'trade_specialist', label: 'Trade Specialist' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'client', label: 'Client' },
];

// ALL ROLES (including admin roles, for role editor)
const ALL_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'finance_manager', label: 'Finance' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'support_agent', label: 'Support' },
  ...USER_ROLES
];

// Get available roles for Role Editor (existing users)
const getAvailableRoles = (currentUserRole: string | undefined) => {
  const role = (currentUserRole || '').toLowerCase();

  // SUPER admin can assign all roles except SUPER admin
  if (role === 'super_admin') {
    return ALL_ROLES.filter((r) => r.value !== 'super_admin');
  }

  // Regular ADMIN cannot assign ADMIN or SUPER roles
  if (role === 'admin') {
    return ALL_ROLES.filter((r) => r.value !== 'admin' && r.value !== 'super_admin');
  }

  // Default: return user roles only
  return USER_ROLES;
};

// Get available roles for Create User (new users - USER ROLES ONLY)
const getAvailableRolesForCreate = (currentUserRole: string | undefined) => {
  // Only allow creating regular users, not admins
  return USER_ROLES;
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  admin_app: 'Platform Admin (Mobile)',
  finance_manager: 'Finance',
  moderator: 'Moderator',
  support_agent: 'Support',
  project_manager: 'Project Manager',
  general_contractor: 'General Contractor',
  subcontractor: 'Subcontractor',
  trade_specialist: 'Trade Specialist',
  viewer: 'Viewer',
  client: 'Client',
};

export default function UsersManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  // const [loadingMore, setLoadingMore] = useState(false); // Removed cursor logic
  // const [nextCursor, setNextCursor] = useState<string | null>(null);
  // const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [createUserData, setCreateUserData] = useState({
    full_name: '',
    email: '',
    password: '',
    role_code: '',
    phone: '',
    company_name: '',
  });

  // Global Stats State
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });

  const loadStats = async () => {
    try {
      const response = await adminService.getDashboardStats();
      if (response.success && response.data?.users) {
        const u = response.data.users;
        setStats({
          total: u.total || 0,
          active: u.active || 0,
          pending: u.pending || 0,
          suspended: u.suspended || 0
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Get available roles for current user
  const availableRoles = getAvailableRoles(user?.role_code);
  const availableRolesForCreate = getAvailableRolesForCreate(user?.role_code);

  // Load users (Page-based)
  const loadUsers = async (pageParam = page, limitParam = limit) => {
    try {
      setLoading(true);
      // Load stats in parallel
      loadStats();

      const response = await adminService.getAllUsers({
        page: pageParam,
        limit: limitParam,
        search: searchQuery || undefined,
        role: filters.role,
        status: filters.status,
      });

      if (response.success && response.data) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pages || 1);
        setPage(pageParam);

        console.log(`[UsersManagement] Loaded ${response.data.users.length} users. Checking statuses:`);
        response.data.users.forEach((u: any) => {
          if (u.status === 'suspended' || u.is_active === false) {
            console.log(`Found SUSPENDED user: ${u.email} (is_active: ${u.is_active}, status: ${u.status})`);
          }
        });

      } else {
        console.error('[UsersManagement] API response not successful:', response);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('[UsersManagement] Failed to load users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    console.log('🔴 Clicking Suspend for user:', userId);
    try {
      const response = await adminService.suspendUser(userId);
      console.log('🔴 Suspend API Response:', response);

      if (response.success) {
        const serverStatus = response.data?.is_active === false ? "Suspended" : "Active (Failed)";
        toast.success(`User suspended. Backend says: ${serverStatus}`);

        // Instantly update local state
        setUsers(current => current.map(u =>
          u.id === userId ? { ...u, is_active: false, status: 'suspended' } : u
        ));

        // Refresh with delay to allow DB propagation
        setTimeout(refreshUsers, 500);
      } else {
        console.error('🔴 Suspend failed:', response);
        toast.error(response.message || 'Failed to suspend user');
      }
    } catch (error: any) {
      console.error('🔴 Suspend API Error:', error);
      toast.error('Suspend Error: ' + (error.message || 'Unknown'));
    }
  };

  const handleUnsuspend = async (userId: string) => {
    console.log('🟢 Clicking Unsuspend for user:', userId);
    try {
      const response = await adminService.unsuspendUser(userId);
      console.log('🟢 Unsuspend API Response:', response);

      if (response.success) {
        toast.success('User unsuspended');
        setUsers(current => current.map(u =>
          u.id === userId ? { ...u, is_active: true, status: 'active' } : u
        ));
        setTimeout(refreshUsers, 500);
      } else {
        console.error('🟢 Unsuspend failed:', response);
        toast.error(response.message || 'Failed to unsuspend user');
      }
    } catch (error: any) {
      console.error('🟢 Unsuspend API Error:', error);
      toast.error('Unsuspend Error: ' + (error.message || 'Unknown'));
    }
  };

  // Refresh users list
  const refreshUsers = () => {
    loadUsers(page, limit);
  };

  useEffect(() => {
    loadUsers(page, limit);
  }, [page, limit]); // Re-fetch on page/limit change



  // Filter users based on search, filters, and tab
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          ROLE_LABELS[user.role_code]?.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    if (filters.role) {
      filtered = filtered.filter((u) => u.role_code === filters.role);
    }
    if (filters.status) {
      filtered = filtered.filter((u) => u.status === filters.status);
    }
    if (filters.verification_status) {
      filtered = filtered.filter((u) => u.verification_status === filters.verification_status);
    }
    if (filters.date_from) {
      filtered = filtered.filter((u) => {
        if (!u.created_at) return false;
        return new Date(u.created_at) >= filters.date_from!;
      });
    }
    if (filters.date_to) {
      filtered = filtered.filter((u) => {
        if (!u.created_at) return false;
        const dateTo = new Date(filters.date_to!);
        dateTo.setHours(23, 59, 59, 999);
        return new Date(u.created_at) <= dateTo;
      });
    }

    // Apply tab filter
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter((u) => u.verification_status === 'pending' || u.verification_status === 'unverified');
        break;
      case 'suspended':
        // Check is_active field (backend sets this to false when suspending)
        filtered = filtered.filter((u) => u.is_active === false || u.status === 'suspended');
        break;
      case 'all':
      default:
        break;
    }

    return filtered;
  }, [users, searchQuery, activeTab, filters]);

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleViewUser = (userId: string) => {
    router.push(`/dashboard/users/${userId}`);
  };

  const handleRoleChange = async (userId: string, roleCode: string) => {
    const currentUserRole = (user?.role_code || '').toLowerCase();
    const targetUser = users.find(u => u.id === userId);
    const targetUserRole = (targetUser?.role_code || '').toLowerCase();
    const newRole = roleCode.toLowerCase();

    // Prevent SUPER admin from assigning SUPER admin role
    if (currentUserRole === 'super_admin' && newRole === 'super_admin') {
      toast.error('You cannot assign Super Admin role to anyone.');
      return;
    }

    // Prevent SUPER admin from changing SUPER admin users
    if (currentUserRole === 'super_admin' && targetUserRole === 'super_admin') {
      toast.error('You cannot change Super Admin roles.');
      return;
    }

    // Prevent ADMIN from assigning ADMIN or SUPER admin roles
    if (currentUserRole === 'admin' && (newRole === 'admin' || newRole === 'super_admin')) {
      toast.error('You cannot assign Admin or Super Admin roles.');
      return;
    }

    // Prevent ADMIN from changing ADMIN or SUPER admin users
    if (currentUserRole === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'super_admin')) {
      toast.error('You cannot change Admin or Super Admin roles.');
      return;
    }

    try {
      const response = await adminService.updateUserRole(userId, roleCode);
      if (response.success) {
        toast.success('User role updated');
        refreshUsers(); // Refresh instead of loadUsers to reset pagination
      } else {
        toast.error(response.message || 'Failed to update role');
      }
    } catch (error: any) {
      toast.error('Failed to update role');
    }
  };


  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        toast.success('User deleted');
        refreshUsers();
      } else {
        toast.error(response.message || 'Failed to delete user');
      }
    } catch (error: any) {
      toast.error('Failed to delete user');
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      const response = await adminService.verifyUser(userId);
      if (response.success) {
        toast.success('User verified');
        refreshUsers();
      } else {
        toast.error(response.message || 'Failed to verify user');
      }
    } catch (error: any) {
      toast.error('Failed to verify user');
    }
  };

  const handleCreateUser = async () => {
    if (!createUserData.full_name || !createUserData.email || !createUserData.password || !createUserData.role_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    const currentUserRole = (user?.role_code || '').toLowerCase();
    const selectedRole = createUserData.role_code.toLowerCase();

    // Prevent ADMIN from creating ADMIN or SUPER admin users
    if (currentUserRole === 'admin' && (selectedRole === 'admin' || selectedRole === 'super_admin')) {
      toast.error('You cannot create Admin or Super Admin users.');
      return;
    }

    // Prevent SUPER admin from creating SUPER admin users
    if (currentUserRole === 'super_admin' && selectedRole === 'super_admin') {
      toast.error('You cannot create Super Admin users.');
      return;
    }

    try {
      setCreateLoading(true);
      const response = await adminService.createUser({
        full_name: createUserData.full_name,
        email: createUserData.email,
        password: createUserData.password,
        role_code: createUserData.role_code,
        phone: createUserData.phone || undefined,
        company_name: createUserData.company_name || undefined,
      });

      if (response.success) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        setCreateUserData({
          full_name: '',
          email: '',
          password: '',
          role_code: '',
          phone: '',
          company_name: '',
        });
        refreshUsers(); // Refresh to show new user
      } else {
        toast.error(response.message || 'Failed to create user');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  // ... (getStatusBadge, getInitials, formatDate, loading check unchanged) ...
  // Re-declare them here if needed to match chunk context, 
  // but looking at ReplaceFileContent, I should be careful to target correctly.
  // I'll skip re-declaring helper functions if they are outside the target range or I can just edit the handlers.



  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
      case undefined:
      case null:
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500 text-white">Suspended</Badge>;
      case 'deleted':
        return <Badge className="bg-red-500 text-white">Deleted</Badge>;
      case 'locked':
        return <Badge className="bg-gray-500 text-white">Locked</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 text-white">Pending</Badge>;
      default:
        return <Badge className="bg-green-500 text-white">Active</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Manage all users, verifications, and permissions</p>
        </div>
        {availableRolesForCreate.length > 0 && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add New User</span>
            <span className="sm:hidden">Add User</span>
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Total Users</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.total.toLocaleString()}</p>
              </div>
              <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Active Users</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.active.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">
                  <span className="hidden sm:inline">Pending Verification</span>
                  <span className="sm:hidden">Pending</span>
                </p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">Suspended</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{stats.suspended}</p>
              </div>
              <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters({})}
        />
        <BulkActions
          selectedUsers={selectedUsers}
          onActionComplete={() => {
            setSelectedUsers([]);
            refreshUsers();
          }}
        />
        <div className="w-[140px]">
          <Select
            value={limit.toString()}
            onValueChange={(val) => {
              setLimit(parseInt(val));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              // Convert Date objects to ISO strings for API
              const exportFilters: any = {
                role: filters.role,
                status: filters.status,
                verification_status: filters.verification_status,
                trust_score_min: filters.trust_score_min,
                trust_score_max: filters.trust_score_max,
                location: filters.location,
                date_from: filters.date_from?.toISOString(),
                date_to: filters.date_to?.toISOString(),
              };
              const blob = await adminService.exportUsers(exportFilters);
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              toast.success('Users exported successfully');
            } catch (error: any) {
              toast.error('Failed to export users');
            }
          }}
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Tabs and Table */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:flex md:inline-flex w-full md:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="text-xs md:text-sm">
                All Users
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Pending Verification</span>
                <span className="sm:hidden">Pending</span>
                {stats.pending > 0 && (
                  <Badge className="ml-1 md:ml-2 bg-red-500 text-white text-xs">{stats.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="suspended" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Suspended Users</span>
                <span className="sm:hidden">Suspended</span>
              </TabsTrigger>
              <TabsTrigger value="role-editor" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Role Editor</span>
                <span className="sm:hidden">Roles</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 md:mt-6">
              <div className="mb-4">
                <h3 className="text-base md:text-lg font-semibold">
                  {activeTab === 'all' && `All Users (${filteredUsers.length})`}
                  {activeTab === 'pending' && `Pending Verifications (${filteredUsers.length})`}
                  {activeTab === 'suspended' && `Suspended Users (${filteredUsers.length})`}
                  {activeTab === 'role-editor' && `Role Editor (${filteredUsers.length})`}
                </h3>
              </div>

              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredUsers.length > 0 &&
                              selectedUsers.length === filteredUsers.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead className="min-w-[120px]">Role</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[100px] hidden sm:table-cell">Verified</TableHead>
                        <TableHead className="min-w-[80px] hidden md:table-cell">Trust Score</TableHead>
                        <TableHead className="min-w-[80px] hidden md:table-cell">Jobs/Bids</TableHead>
                        <TableHead className="min-w-[100px] hidden lg:table-cell">Joined</TableHead>
                        <TableHead className="min-w-[100px] hidden xl:table-cell">Last Active</TableHead>
                        <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectUser(user.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-600 text-white">
                                    {getInitials(user.full_name || user.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.full_name || 'N/A'}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {activeTab === 'role-editor' ? (
                                <Select
                                  value={user.role_code}
                                  onValueChange={(value) => handleRoleChange(user.id, value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableRoles.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span>{ROLE_LABELS[user.role_code] || user.role_code}</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status || (user.is_active === false ? 'suspended' : 'active'))}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {user.verification_status === 'verified' ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Verified</span>
                                </div>
                              ) : user.verification_status === 'pending' ? (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Clock className="h-4 w-4" />
                                  <span>Pending</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <XCircle className="h-4 w-4" />
                                  <span>Unverified</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-gray-900">{user.trust_score || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">0</span>
                                {/* TODO: Get from API */}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-gray-600">
                                {formatDate(user.created_at)}
                              </span>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <span className="text-gray-600">
                                {user.last_login_at
                                  ? formatDate(user.last_login_at)
                                  : 'Never'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {!user.email_verified && (
                                    <DropdownMenuItem onClick={() => handleVerify(user.id)}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Verify User
                                    </DropdownMenuItem>
                                  )}
                                  {user.status === 'suspended' || user.is_active === false ? (
                                    <DropdownMenuItem onClick={() => handleUnsuspend(user.id)}>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Unsuspend
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                                      <ShieldOff className="h-4 w-4 mr-2" />
                                      Suspend
                                    </DropdownMenuItem>
                                  )}
                                  {user.status !== 'deleted' && user.status !== 'suspended' && (
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(user.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Load More Button */}
              <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
                <div className="text-sm text-gray-600">
                  Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="hidden md:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      // Simple logic for < 5 pages. For robust we need the full helper.
                      // Using a simplified view for stability in multi_replace
                      let pNum = i + 1;
                      if (totalPages > 5) {
                        // Center around current page
                        if (page > 3) pNum = page - 2 + i;
                        if (pNum > totalPages) pNum = totalPages - (4 - i);
                      }
                      if (pNum > 0 && pNum <= totalPages) {
                        return (
                          <Button
                            key={pNum}
                            variant={page === pNum ? "default" : "outline"}
                            size="sm"
                            className={`w-8 h-8 p-0 ${page === pNum ? 'bg-blue-600 text-white' : ''}`}
                            onClick={() => setPage(pNum)}
                          >
                            {pNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] max-h-[95vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Create New User</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new user account. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-2 md:py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter full name"
                value={createUserData.full_name}
                onChange={(e) => setCreateUserData({ ...createUserData, full_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={createUserData.email}
                onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={createUserData.phone}
                onChange={(e) => setCreateUserData({ ...createUserData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                placeholder="Enter company name"
                value={createUserData.company_name}
                onChange={(e) => setCreateUserData({ ...createUserData, company_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={createUserData.password}
                onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role_code">Role *</Label>
              <Select
                value={createUserData.role_code}
                onValueChange={(value) => setCreateUserData({ ...createUserData, role_code: value })}
              >
                <SelectTrigger id="role_code">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRolesForCreate.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableRolesForCreate.length === 0 && (
                <p className="text-sm text-gray-500">You don't have permission to create users.</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setCreateUserData({
                  full_name: '',
                  email: '',
                  password: '',
                  role_code: '',
                  phone: '',
                  company_name: '',
                });
              }}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={
                createLoading ||
                !createUserData.full_name ||
                !createUserData.email ||
                !createUserData.password ||
                !createUserData.role_code ||
                availableRolesForCreate.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
            >
              {createLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
