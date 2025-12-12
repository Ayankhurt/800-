'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { adminService, PermissionMatrix } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function AccessControl() {
  return (
    <Tabs defaultValue="roles" className="space-y-4">
      <TabsList>
        <TabsTrigger value="roles">Role Management</TabsTrigger>
        <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
      </TabsList>

      <TabsContent value="roles">
        <RoleManagementTab />
      </TabsContent>

      <TabsContent value="permissions">
        <PermissionMatrixTab />
      </TabsContent>
    </Tabs>
  );
}

function RoleManagementTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: {} as Record<string, any>,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllRoles();
      if (response.success) {
        setRoles(response.data.roles || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        await adminService.updateRole(editingRole.id, formData);
        toast.success('Role updated');
      } else {
        await adminService.createRole(formData);
        toast.success('Role created');
      }
      setShowDialog(false);
      resetForm();
      loadRoles();
    } catch (error: any) {
      toast.error('Failed to save role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await adminService.deleteRole(id);
      toast.success('Role deleted');
      loadRoles();
    } catch (error: any) {
      toast.error('Failed to delete role');
    }
  };

  const resetForm = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      permissions: {},
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Role Management</CardTitle>
          <Button onClick={() => {
            resetForm();
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="font-mono text-sm">{role.code}</TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRole(role);
                            setFormData({
                              name: role.name,
                              code: role.code,
                              description: role.description || '',
                              permissions: role.permissions || {},
                            });
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="ROLE_CODE"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.code}>
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PermissionMatrixTab() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPermissionMatrix();
      if (response.success) {
        setMatrix(response.data.matrix || response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load permission matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!matrix) return;
    try {
      setSaving(true);
      await adminService.updatePermissionMatrix(matrix);
      toast.success('Permission matrix updated');
    } catch (error: any) {
      toast.error('Failed to update permission matrix');
    } finally {
      setSaving(false);
    }
  };

  const updatePermission = (resource: keyof PermissionMatrix, permission: string, value: boolean) => {
    if (!matrix) return;
    setMatrix({
      ...matrix,
      [resource]: {
        ...matrix[resource],
        [permission]: value,
      },
    });
  };

  if (loading || !matrix) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading permission matrix...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Permission Matrix</CardTitle>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Users Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Users</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.users.view}
                  onCheckedChange={(checked) => updatePermission('users', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Create</Label>
                <Switch
                  checked={matrix.users.create}
                  onCheckedChange={(checked) => updatePermission('users', 'create', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Edit</Label>
                <Switch
                  checked={matrix.users.edit}
                  onCheckedChange={(checked) => updatePermission('users', 'edit', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Delete</Label>
                <Switch
                  checked={matrix.users.delete}
                  onCheckedChange={(checked) => updatePermission('users', 'delete', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Suspend</Label>
                <Switch
                  checked={matrix.users.suspend}
                  onCheckedChange={(checked) => updatePermission('users', 'suspend', checked)}
                />
              </div>
            </div>
          </div>

          {/* Jobs Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Jobs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.jobs.view}
                  onCheckedChange={(checked) => updatePermission('jobs', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Edit</Label>
                <Switch
                  checked={matrix.jobs.edit}
                  onCheckedChange={(checked) => updatePermission('jobs', 'edit', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Delete</Label>
                <Switch
                  checked={matrix.jobs.delete}
                  onCheckedChange={(checked) => updatePermission('jobs', 'delete', checked)}
                />
              </div>
            </div>
          </div>

          {/* Projects Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Projects</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.projects.view}
                  onCheckedChange={(checked) => updatePermission('projects', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Edit</Label>
                <Switch
                  checked={matrix.projects.edit}
                  onCheckedChange={(checked) => updatePermission('projects', 'edit', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Override</Label>
                <Switch
                  checked={matrix.projects.override}
                  onCheckedChange={(checked) => updatePermission('projects', 'override', checked)}
                />
              </div>
            </div>
          </div>

          {/* Payments Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Payments</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.payments.view}
                  onCheckedChange={(checked) => updatePermission('payments', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Refund</Label>
                <Switch
                  checked={matrix.payments.refund}
                  onCheckedChange={(checked) => updatePermission('payments', 'refund', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Release</Label>
                <Switch
                  checked={matrix.payments.release}
                  onCheckedChange={(checked) => updatePermission('payments', 'release', checked)}
                />
              </div>
            </div>
          </div>

          {/* Disputes Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Disputes</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.disputes.view}
                  onCheckedChange={(checked) => updatePermission('disputes', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Mediate</Label>
                <Switch
                  checked={matrix.disputes.mediate}
                  onCheckedChange={(checked) => updatePermission('disputes', 'mediate', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Resolve</Label>
                <Switch
                  checked={matrix.disputes.resolve}
                  onCheckedChange={(checked) => updatePermission('disputes', 'resolve', checked)}
                />
              </div>
            </div>
          </div>

          {/* Settings Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.settings.view}
                  onCheckedChange={(checked) => updatePermission('settings', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Edit</Label>
                <Switch
                  checked={matrix.settings.edit}
                  onCheckedChange={(checked) => updatePermission('settings', 'edit', checked)}
                />
              </div>
            </div>
          </div>

          {/* Reports Permissions */}
          <div>
            <h3 className="font-semibold mb-3">Reports</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>View</Label>
                <Switch
                  checked={matrix.reports.view}
                  onCheckedChange={(checked) => updatePermission('reports', 'view', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Export</Label>
                <Switch
                  checked={matrix.reports.export}
                  onCheckedChange={(checked) => updatePermission('reports', 'export', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


