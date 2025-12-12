'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { adminService, EmailCampaign } from '@/src/lib/api/adminService';
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
  Plus,
  Send,
  Eye,
  Trash2,
  BarChart3,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    target_segment: {},
    scheduled_at: '',
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEmailCampaigns();
      if (response.success) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (error: any) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminService.createEmailCampaign(formData);
      if (response.success) {
        toast.success('Campaign created');
        setShowCreateDialog(false);
        resetForm();
        loadCampaigns();
      }
    } catch (error: any) {
      toast.error('Failed to create campaign');
    }
  };

  const handleSend = async (campaign: EmailCampaign) => {
    if (!confirm(`Send campaign "${campaign.name}" to ${campaign.recipients_count} recipients?`)) {
      return;
    }

    try {
      const response = await adminService.sendEmailCampaign(campaign.id);
      if (response.success) {
        toast.success('Campaign sent');
        loadCampaigns();
      }
    } catch (error: any) {
      toast.error('Failed to send campaign');
    }
  };

  const handleDelete = async (campaign: EmailCampaign) => {
    if (!confirm(`Delete campaign "${campaign.name}"?`)) {
      return;
    }

    try {
      const response = await adminService.deleteEmailCampaign(campaign.id);
      if (response.success) {
        toast.success('Campaign deleted');
        loadCampaigns();
      }
    } catch (error: any) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleViewAnalytics = async (campaign: EmailCampaign) => {
    try {
      const response = await adminService.getEmailCampaignAnalytics(campaign.id);
      if (response.success) {
        const analytics = response.data;
        alert(
          `Campaign Analytics:\n\n` +
          `Recipients: ${campaign.recipients_count}\n` +
          `Opened: ${campaign.opened_count} (${((campaign.opened_count / campaign.recipients_count) * 100).toFixed(1)}%)\n` +
          `Clicked: ${campaign.clicked_count} (${((campaign.clicked_count / campaign.recipients_count) * 100).toFixed(1)}%)`
        );
      }
    } catch (error: any) {
      toast.error('Failed to load analytics');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      target_segment: {},
      scheduled_at: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-500' },
      scheduled: { label: 'Scheduled', className: 'bg-blue-500' },
      sending: { label: 'Sending', className: 'bg-yellow-500' },
      sent: { label: 'Sent', className: 'bg-green-500' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Email Campaigns</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Create and manage email marketing campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Recipients</TableHead>
                <TableHead className="hidden lg:table-cell">Opened</TableHead>
                <TableHead className="hidden lg:table-cell">Clicked</TableHead>
                <TableHead className="hidden lg:table-cell">Sent At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No campaigns found. Create your first campaign to get started.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-semibold">{campaign.name}</TableCell>
                    <TableCell>{campaign.subject}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {campaign.recipients_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {campaign.opened_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {campaign.clicked_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {campaign.sent_at
                        ? format(new Date(campaign.sent_at), 'PPpp')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSend(campaign)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        )}
                        {campaign.status === 'sent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAnalytics(campaign)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(campaign)}
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>
              Create a new email marketing campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter email content"
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Scheduled At (optional)</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <Mail className="h-4 w-4 inline mr-2" />
                Target segment configuration coming soon. For now, campaigns target all users.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


