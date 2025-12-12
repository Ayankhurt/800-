'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { adminService, Announcement } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'maintenance' | 'feature' | 'promotion' | 'alert',
    target_audience: 'all' as 'all' | 'contractors' | 'owners' | 'specific_role',
    start_date: '',
    end_date: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAnnouncements();
      if (response.success) {
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error: any) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminService.createAnnouncement(formData);
      if (response.success) {
        toast.success('Announcement created');
        setShowCreateDialog(false);
        resetForm();
        loadAnnouncements();
      }
    } catch (error: any) {
      toast.error('Failed to create announcement');
    }
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement || !formData.title.trim() || !formData.content.trim()) {
      return;
    }

    try {
      const response = await adminService.updateAnnouncement(editingAnnouncement.id, formData);
      if (response.success) {
        toast.success('Announcement updated');
        setEditingAnnouncement(null);
        resetForm();
        loadAnnouncements();
      }
    } catch (error: any) {
      toast.error('Failed to update announcement');
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Delete announcement "${announcement.title}"?`)) {
      return;
    }

    try {
      const response = await adminService.deleteAnnouncement(announcement.id);
      if (response.success) {
        toast.success('Announcement deleted');
        loadAnnouncements();
      }
    } catch (error: any) {
      toast.error('Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      target_audience: 'all',
      start_date: '',
      end_date: '',
      priority: 'normal',
    });
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      target_audience: announcement.target_audience,
      start_date: announcement.start_date || '',
      end_date: announcement.end_date || '',
      priority: announcement.priority,
    });
    setShowCreateDialog(true);
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      info: { label: 'Info', className: 'bg-blue-500' },
      warning: { label: 'Warning', className: 'bg-yellow-500' },
      maintenance: { label: 'Maintenance', className: 'bg-orange-500' },
      feature: { label: 'Feature', className: 'bg-green-500' },
      promotion: { label: 'Promotion', className: 'bg-purple-500' },
      alert: { label: 'Alert', className: 'bg-red-500' },
    };

    const config = typeConfig[type] || { label: type, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Announcements</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage platform announcements
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingAnnouncement(null);
          setShowCreateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead className="hidden md:table-cell">Priority</TableHead>
                <TableHead className="hidden lg:table-cell">Start Date</TableHead>
                <TableHead className="hidden lg:table-cell">End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No announcements found. Create your first announcement.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-semibold">{announcement.title}</TableCell>
                    <TableCell>{getTypeBadge(announcement.type)}</TableCell>
                    <TableCell className="capitalize">
                      {announcement.target_audience.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {announcement.priority}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {announcement.start_date
                        ? format(new Date(announcement.start_date), 'PP')
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {announcement.end_date
                        ? format(new Date(announcement.end_date), 'PP')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {announcement.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-500">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(announcement)}
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? 'Update announcement details' : 'Create a new platform announcement'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter announcement content"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value: any) => setFormData({ ...formData, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="contractors">Contractors</SelectItem>
                    <SelectItem value="owners">Owners</SelectItem>
                    <SelectItem value="specific_role">Specific Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
                setEditingAnnouncement(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingAnnouncement ? handleUpdate : handleCreate}>
              {editingAnnouncement ? 'Update' : 'Create'} Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


