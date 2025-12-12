'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, CustomReport } from '@/src/lib/api/adminService';
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
  Download,
  Trash2,
  Edit,
  Calendar,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

export default function CustomReportsBuilder() {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    report_config: {},
    schedule: {
      frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
      time: '',
      recipients: [] as string[],
    },
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCustomReports();
      if (response.success) {
        setReports(response.data.reports || []);
      }
    } catch (error: any) {
      toast.error('Failed to load custom reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    try {
      const response = await adminService.createCustomReport(formData);
      if (response.success) {
        toast.success('Report created');
        setShowCreateDialog(false);
        resetForm();
        loadReports();
      }
    } catch (error: any) {
      toast.error('Failed to create report');
    }
  };

  const handleUpdate = async () => {
    if (!editingReport || !formData.name.trim()) {
      return;
    }

    try {
      const response = await adminService.updateCustomReport(editingReport.id, formData);
      if (response.success) {
        toast.success('Report updated');
        setEditingReport(null);
        resetForm();
        loadReports();
      }
    } catch (error: any) {
      toast.error('Failed to update report');
    }
  };

  const handleDelete = async (report: CustomReport) => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?`)) {
      return;
    }

    try {
      const response = await adminService.deleteCustomReport(report.id);
      if (response.success) {
        toast.success('Report deleted');
        loadReports();
      }
    } catch (error: any) {
      toast.error('Failed to delete report');
    }
  };

  const handleGenerate = async (report: CustomReport) => {
    try {
      const blob = await adminService.generateCustomReport(report.id, { format: 'pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report generated');
    } catch (error: any) {
      toast.error('Failed to generate report');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      report_config: {},
      schedule: {
        frequency: 'monthly',
        time: '',
        recipients: [],
      },
    });
  };

  const openEditDialog = (report: CustomReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      description: report.description || '',
      report_config: report.report_config || {},
      schedule: report.schedule || {
        frequency: 'monthly',
        time: '',
        recipients: [],
      },
    });
    setShowCreateDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Custom Reports Builder</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Create and manage custom analytics reports
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingReport(null);
          setShowCreateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Schedule</TableHead>
                <TableHead className="hidden lg:table-cell">Last Generated</TableHead>
                <TableHead className="hidden lg:table-cell">Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No custom reports found. Create your first report to get started.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-semibold">{report.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {report.description || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {report.schedule ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm capitalize">
                            {report.schedule.frequency}
                            {report.schedule.time && ` at ${report.schedule.time}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No schedule</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {report.last_generated_at
                        ? format(new Date(report.last_generated_at), 'PPpp')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {report.created_by?.full_name || 'System'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(report)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(report)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(report)}
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
              {editingReport ? 'Edit Report' : 'Create Custom Report'}
            </DialogTitle>
            <DialogDescription>
              Configure your custom analytics report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter report name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter report description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule Frequency</Label>
              <Select
                value={formData.schedule.frequency}
                onValueChange={(value: any) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, frequency: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule Time (optional)</Label>
              <Input
                type="time"
                value={formData.schedule.time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, time: e.target.value },
                  })
                }
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <FileText className="h-4 w-4 inline mr-2" />
                Report configuration builder coming soon. For now, reports use default configurations.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
                setEditingReport(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingReport ? handleUpdate : handleCreate}>
              {editingReport ? 'Update' : 'Create'} Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


