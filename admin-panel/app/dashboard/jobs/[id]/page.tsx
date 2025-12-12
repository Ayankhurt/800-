'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Shield,
  Star,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
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
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';

export default function JobDetailView() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const response = await adminService.getJobDetails(jobId);
      if (response.success) {
        setJob(response.data);
        setEditData(response.data);
      } else {
        toast.error('Failed to load job details');
        router.push('/dashboard/jobs');
      }
    } catch (error: any) {
      toast.error('Failed to load job details');
      router.push('/dashboard/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await adminService.updateJob(jobId, editData);
      if (response.success) {
        toast.success('Job updated successfully');
        setEditMode(false);
        loadJobDetails();
      } else {
        toast.error('Failed to update job');
      }
    } catch (error: any) {
      toast.error('Failed to update job');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await adminService.deleteJob(jobId);
      if (response.success) {
        toast.success('Job deleted');
        router.push('/dashboard/jobs');
      }
    } catch (error: any) {
      toast.error('Failed to delete job');
    }
  };

  const handleExtendDeadline = async () => {
    if (!newDeadline) {
      toast.error('Please select a new deadline');
      return;
    }

    try {
      const response = await adminService.extendJobDeadline(jobId, newDeadline);
      if (response.success) {
        toast.success('Deadline extended');
        setShowExtendDialog(false);
        setNewDeadline('');
        loadJobDetails();
      }
    } catch (error: any) {
      toast.error('Failed to extend deadline');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'bg-green-500' },
      in_progress: { label: 'In Progress', className: 'bg-blue-500' },
      completed: { label: 'Completed', className: 'bg-gray-500' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500' },
      closed: { label: 'Closed', className: 'bg-orange-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/jobs')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
              {job.featured && (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">Job ID: {job.id}</p>
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
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-lg font-bold">
                  {job.budget ? `$${job.budget.toLocaleString()}` : 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(job.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-lg font-bold">{job.applications_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-lg font-bold">
                  {job.deadline
                    ? format(new Date(job.deadline), 'MMM dd, yyyy')
                    : 'No deadline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                {editMode ? (
                  <Input
                    value={editData.title || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{job.title}</p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                {editMode ? (
                  <Textarea
                    value={editData.description || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="mt-1"
                    rows={6}
                  />
                ) : (
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {job.description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Trade Type</Label>
                  {editMode ? (
                    <Input
                      value={editData.trade_type || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, trade_type: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{job.trade_type || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>Budget</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={editData.budget || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          budget: Number(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">
                      {job.budget ? `$${job.budget.toLocaleString()}` : 'Not specified'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Location</Label>
                  {editMode ? (
                    <Input
                      value={editData.location || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, location: e.target.value })
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{job.location || '-'}</p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  {editMode ? (
                    <Select
                      value={editData.status}
                      onValueChange={(value) =>
                        setEditData({ ...editData, status: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getStatusBadge(job.status)}</div>
                  )}
                </div>
              </div>
              <div>
                <Label>Posted By</Label>
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{job.posted_by?.full_name || job.posted_by?.email || '-'}</span>
                  {job.posted_by?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/users/${job.posted_by.id}`)
                      }
                    >
                      View Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications ({job.applications?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {job.applications && job.applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.applications.map((app: any) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          {app.contractor?.full_name || app.contractor?.email}
                        </TableCell>
                        <TableCell>
                          <Badge>{app.status || 'pending'}</Badge>
                        </TableCell>
                        <TableCell>
                          {app.bid_amount
                            ? `$${app.bid_amount.toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {app.created_at
                            ? format(new Date(app.created_at), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/users/${app.contractor?.id}`)
                            }
                          >
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No applications yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Timeline will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  const newStatus =
                    job.status === 'open' ? 'closed' : 'open';
                  try {
                    const response = await adminService.changeJobStatus(
                      jobId,
                      newStatus
                    );
                    if (response.success) {
                      toast.success(`Job ${newStatus}`);
                      loadJobDetails();
                    }
                  } catch (error: any) {
                    toast.error('Failed to change status');
                  }
                }}
              >
                {job.status === 'open' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Close Job
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Reopen Job
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  try {
                    const response = await adminService.featureJob(
                      jobId,
                      !job.featured
                    );
                    if (response.success) {
                      toast.success(
                        job.featured ? 'Job unfeatured' : 'Job featured'
                      );
                      loadJobDetails();
                    }
                  } catch (error: any) {
                    toast.error('Failed to feature job');
                  }
                }}
              >
                <Star className="h-4 w-4 mr-2" />
                {job.featured ? 'Unfeature Job' : 'Feature Job'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowExtendDialog(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Extend Deadline
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  const reason = prompt('Enter reason for flagging:');
                  if (reason) {
                    try {
                      const response = await adminService.flagJob(jobId, reason);
                      if (response.success) {
                        toast.success('Job flagged');
                        loadJobDetails();
                      }
                    } catch (error: any) {
                      toast.error('Failed to flag job');
                    }
                  }
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Flag Inappropriate Content
              </Button>
              {job.posted_by?.email && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    window.location.href = `mailto:${job.posted_by.email}`;
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Job Poster
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add admin notes here..."
                rows={4}
                defaultValue={job.admin_notes || ''}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Deadline</DialogTitle>
            <DialogDescription>
              Select a new deadline for this job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-deadline">New Deadline</Label>
              <Input
                id="new-deadline"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExtendDialog(false);
                setNewDeadline('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleExtendDeadline} disabled={!newDeadline}>
              Extend Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


