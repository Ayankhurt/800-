'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  adminService,
  Job,
  Application,
  TimelineItem,
  Appointment,
  AdminNote,
} from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Star,
  Flag,
  Trash2,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

interface JobDetailViewProps {
  jobId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function JobDetailView({ jobId, onBack, onUpdate }: JobDetailViewProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newStatus, setNewStatus] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes, timelineRes, appointmentsRes, notesRes] = await Promise.all([
        adminService.getJobDetails(jobId),
        adminService.getJobApplications(jobId),
        adminService.getJobTimeline(jobId),
        adminService.getJobAppointments(jobId),
        adminService.getJobDetails(jobId), // Assuming notes come with job details
      ]);

      if (jobRes.success) {
        setJob(jobRes.data);
        setEditData({
          title: jobRes.data.title,
          description: jobRes.data.description,
          budget: jobRes.data.budget,
          deadline: jobRes.data.deadline,
          status: jobRes.data.status,
        });
      }
      if (appsRes.success) {
        setApplications(appsRes.data.applications || appsRes.data || []);
      }
      if (timelineRes.success) {
        setTimeline(timelineRes.data.timeline || timelineRes.data || []);
      }
      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.data.appointments || appointmentsRes.data || []);
      }
      if (notesRes.success && notesRes.data.admin_notes) {
        setAdminNotes(notesRes.data.admin_notes);
      }
    } catch (error: any) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    try {
      const response = await adminService.updateJob(jobId, editData);
      if (response.success) {
        toast.success('Job updated successfully');
        setShowEditDialog(false);
        loadJobDetails();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to update job');
    }
  };

  const handleStatusChange = async () => {
    try {
      const response = await adminService.changeJobStatus(jobId, newStatus);
      if (response.success) {
        toast.success('Job status updated');
        setShowStatusDialog(false);
        setNewStatus('');
        loadJobDetails();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to change status');
    }
  };

  const handleExtendDeadline = async () => {
    try {
      const response = await adminService.extendJobDeadline(jobId, newDeadline);
      if (response.success) {
        toast.success('Deadline extended');
        setShowExtendDialog(false);
        setNewDeadline('');
        loadJobDetails();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to extend deadline');
    }
  };

  const handleFeature = async () => {
    try {
      const response = await adminService.featureJob(jobId, !job?.featured);
      if (response.success) {
        toast.success(job?.featured ? 'Job unfeatured' : 'Job featured');
        loadJobDetails();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to feature job');
    }
  };

  const handleFlag = async () => {
    if (!confirm('Are you sure you want to flag this job?')) return;
    try {
      const response = await adminService.flagJob(jobId, 'Inappropriate content');
      if (response.success) {
        toast.success('Job flagged');
        loadJobDetails();
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to flag job');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await adminService.deleteJob(jobId);
      if (response.success) {
        toast.success('Job deleted');
        onUpdate();
      }
    } catch (error: any) {
      toast.error('Failed to delete job');
    }
  };

  const handleContact = async () => {
    if (!contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      const response = await adminService.contactJobPoster(jobId, contactMessage);
      if (response.success) {
        toast.success('Message sent');
        setShowContactDialog(false);
        setContactMessage('');
      }
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    try {
      const response = await adminService.addJobAdminNote(jobId, adminNote);
      if (response.success) {
        toast.success('Note added');
        setShowNoteDialog(false);
        setAdminNote('');
        loadJobDetails();
      }
    } catch (error: any) {
      toast.error('Failed to add note');
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
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Job not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const statusBreakdown = {
    pending: applications.filter((a) => a.status === 'pending').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
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
            <p className="text-sm text-gray-600 mt-1">Job ID: {job.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Job Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(job.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-lg font-bold mt-1">
                  {job.budget_min || job.budget_max ? (
                    `$${(job.budget_min || 0).toLocaleString()} - $${(job.budget_max || 0).toLocaleString()}`
                  ) : job.budget ? (
                    `$${job.budget.toLocaleString()}`
                  ) : (
                    'Not specified'
                  )}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-lg font-bold mt-1">{applications.length}</p>
              </div>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Posted</p>
                <p className="text-sm font-medium mt-1">
                  {job.created_at ? format(new Date(job.created_at), 'MMM dd, yyyy') : '-'}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="notes">Admin Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{job.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trade Type</Label>
                  <p className="text-sm text-gray-700 mt-1">{job.trade_type || '-'}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location || '-'}
                  </p>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {job.deadline ? format(new Date(job.deadline), 'PPP') : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label>Posted By</Label>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {job.posted_by?.full_name || job.posted_by?.email || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{statusBreakdown.pending}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{statusBreakdown.accepted}</p>
                  <p className="text-sm text-gray-500">Accepted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{statusBreakdown.rejected}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStatusDialog(true)}
                  className="w-full"
                >
                  Change Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExtendDialog(true)}
                  className="w-full"
                >
                  Extend Deadline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowContactDialog(true)}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Poster
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNoteDialog(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No applications yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Proposal</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app, index) => (
                      <TableRow key={app.id || index}>
                        <TableCell>
                          {app.contractor?.full_name || app.contractor_id}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{app.proposal || '-'}</p>
                        </TableCell>
                        <TableCell>
                          {app.bid_amount ? `$${app.bid_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge>{app.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {app.created_at
                            ? format(new Date(app.created_at), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No timeline events</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.id || index} className="flex gap-4 border-l-2 border-gray-200 pl-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-500">
                          {item.created_by?.full_name || 'System'} •{' '}
                          {format(new Date(item.timestamp), 'PPP p')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Associated Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No appointments</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt, index) => (
                    <div key={apt.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(apt.scheduled_at), 'PPP p')}
                          </p>
                          {apt.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {apt.location}
                            </p>
                          )}
                        </div>
                        <Badge>{apt.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Admin Notes</CardTitle>
                <Button onClick={() => setShowNoteDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adminNotes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No admin notes</p>
              ) : (
                <div className="space-y-4">
                  {adminNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {note.created_by?.full_name || 'Admin'} •{' '}
                        {format(new Date(note.created_at), 'PPP p')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget</Label>
                <Input
                  type="number"
                  value={editData.budget || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, budget: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={editData.deadline ? new Date(editData.deadline).toISOString().slice(0, 16) : ''}
                  onChange={(e) =>
                    setEditData({ ...editData, deadline: e.target.value || undefined })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editData.status || ''}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateJob}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Job Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus}>
              Change Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Deadline</Label>
              <Input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtendDeadline} disabled={!newDeadline}>
              Extend Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Job Poster</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message</Label>
              <Textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={6}
                placeholder="Enter your message..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleContact} disabled={!contactMessage.trim()}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Note</Label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={6}
                placeholder="Enter admin note..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!adminNote.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


