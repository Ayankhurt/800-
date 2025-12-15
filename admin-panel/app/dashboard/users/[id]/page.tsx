'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Shield,
  ShieldOff,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Clock,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

export default function UserProfileDetails() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserById(userId);
      if (response.success) {
        setUser(response.data);
        setEditData(response.data);
      } else {
        toast.error('Failed to load user details');
        router.push('/dashboard/users');
      }
    } catch (error: any) {
      toast.error('Failed to load user details');
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Prepare update data
      const updateData = { ...editData };
      if (updateData.role_code && !updateData.role) {
        // Map role_code to role
        const roleMap: Record<string, string> = {
          'PM': 'project_manager',
          'GC': 'general_contractor',
          'SUB': 'subcontractor',
          'TS': 'trade_specialist',
          'VIEWER': 'viewer'
        };
        updateData.role = roleMap[updateData.role_code] || updateData.role_code.toLowerCase();
      }

      const response = await adminService.updateUser(userId, updateData);
      if (response.success) {
        toast.success('User updated successfully');
        setEditMode(false);
        // Update local state immediately
        if (response.data) {
          setUser(response.data);
          setEditData(response.data);
        }
        // Then refresh from server
        await loadUserDetails();
      } else {
        toast.error(response.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update user');
    }
  };

  const handleSuspend = async () => {
    try {
      const response = await adminService.suspendUser(userId, suspendReason);
      if (response.success) {
        toast.success('User suspended');
        setShowSuspendDialog(false);
        setSuspendReason('');
        loadUserDetails();
      }
    } catch (error: any) {
      toast.error('Failed to suspend user');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        toast.success('User deleted');
        router.push('/dashboard/users');
      }
    } catch (error: any) {
      toast.error('Failed to delete user');
    }
  };

  const handleExportData = async () => {
    // Stub for export data if needed in future
    toast.info('Export functionality coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">User Profile</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials(user.full_name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{user.full_name || 'N/A'}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    className={
                      !user.is_active
                        ? 'bg-yellow-500' // Suspended/Inactive
                        : 'bg-green-500' // Active
                    }
                  >
                    {!user.is_active ? 'Suspended' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  {user.verification_status === 'verified' ? (
                    <div className="flex items-center text-green-600 gap-1 mt-1">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-500 gap-1 mt-1">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm font-medium">{user.verification_status || 'Unverified'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trust Score</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span>{user.trust_score || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <Badge variant="outline">{user.role_code || user.role}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  {editMode ? (
                    <Input
                      value={editData.full_name || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, full_name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1">{user.full_name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="mt-1">{user.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  {editMode ? (
                    <Input
                      value={editData.phone || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1">{user.phone || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Company</Label>
                  {editMode ? (
                    <Input
                      value={editData.company_name || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, company_name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1">{user.company_name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label>Role</Label>
                  {editMode ? (
                    <Select
                      value={editData.role_code || editData.role}
                      onValueChange={(value) =>
                        setEditData({ ...editData, role_code: value, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="general_contractor">General Contractor</SelectItem>
                        <SelectItem value="subcontractor">Subcontractor</SelectItem>
                        <SelectItem value="trade_specialist">Trade Specialist</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">{user.role_code || user.role}</p>
                  )}
                </div>
                <div>
                  <Label>Registration Date</Label>
                  <p className="mt-1">
                    {user.created_at
                      ? format(new Date(user.created_at), 'PPP')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Jobs/Bids</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Projects Completed</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent/Earned</p>
                  <p className="text-2xl font-bold">$0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Rating</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {/* Contractor Management Link */}
          {(user?.role_code === 'GC' || user?.role_code === 'SUB' || user?.role_code === 'TS') && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/dashboard/users/${userId}/contractor`)}
                >
                  Manage Contractor Profile
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!user.is_active ? (
                <Button
                  variant="outline"
                  className="w-full justify-start border-green-200 hover:bg-green-50 text-green-700"
                  onClick={async () => {
                    const response = await adminService.unsuspendUser(userId);
                    if (response.success) {
                      toast.success('User unsuspended');
                      // Update local state immediately
                      setUser({ ...user, is_active: true });
                    } else {
                      toast.error('Failed to unsuspend');
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Unsuspend (Activate) User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                  onClick={() => setShowSuspendDialog(true)}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Suspend User
                </Button>
              )}

              {user.verification_status !== 'verified' && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-blue-200 hover:bg-blue-50 text-blue-700"
                  onClick={async () => {
                    const response = await adminService.verifyUser(userId);
                    if (response.success) {
                      toast.success('User verified');
                      setUser({ ...user, verification_status: 'verified' });
                    } else {
                      toast.error('Failed to verify');
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify User Manually
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              This user will lose access to their account until unsuspended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason (Optional)</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSuspend} className="bg-yellow-600 hover:bg-yellow-700">
              Confirm Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
