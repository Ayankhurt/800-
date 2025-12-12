'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { adminService, NotificationTemplate, NotificationSettings } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
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
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Bell,
  Send,
} from 'lucide-react';

export default function NotificationManagement() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    subject: '',
    content: '',
    variables: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesResponse, settingsResponse] = await Promise.all([
        adminService.getNotificationTemplates(),
        adminService.getNotificationSettings(),
      ]);

      if (templatesResponse.success) {
        setTemplates(templatesResponse.data.templates || []);
      }

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
      }
    } catch (error: any) {
      toast.error('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminService.createNotificationTemplate(formData);
      if (response.success) {
        toast.success('Template created');
        setShowTemplateDialog(false);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim() || !formData.content.trim()) {
      return;
    }

    try {
      const response = await adminService.updateNotificationTemplate(editingTemplate.id, formData);
      if (response.success) {
        toast.success('Template updated');
        setEditingTemplate(null);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await adminService.deleteNotificationTemplate(template.id);
      if (response.success) {
        toast.success('Template deleted');
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleSendTest = async (template: NotificationTemplate) => {
    const email = prompt('Enter recipient email:');
    if (!email) return;

    try {
      const response = await adminService.sendTestNotification(template.id, email);
      if (response.success) {
        toast.success('Test notification sent');
      }
    } catch (error: any) {
      toast.error('Failed to send test notification');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      subject: '',
      content: '',
      variables: [],
    });
  };

  const openEditDialog = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables || [],
    });
    setShowTemplateDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notification Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage notification templates and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => {
            resetForm();
            setEditingTemplate(null);
            setShowTemplateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Variables</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No templates found. Create your first template.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-semibold">{template.name}</TableCell>
                    <TableCell className="capitalize">{template.type}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {template.subject || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {template.variables && template.variables.length > 0
                        ? template.variables.join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendTest(template)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template)}
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

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update notification template' : 'Create a new notification template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Input
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., email, push, sms"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject line"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter template content. Use {{variable}} for dynamic content."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplateDialog(false);
                resetForm();
                setEditingTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure default notification preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <Bell className="h-4 w-4 inline mr-2" />
                Notification settings configuration coming soon. This will include frequency caps, quiet hours, and priority settings.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


