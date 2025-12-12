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
  Project,
  ProjectContract,
  Milestone,
  ProgressUpdate,
  PaymentRecord,
} from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Plus,
  AlertTriangle,
  Eye,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ProjectDetailViewProps {
  projectId: string;
}

export default function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [contract, setContract] = useState<ProjectContract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const [
        projectRes,
        contractRes,
        milestonesRes,
        progressRes,
        paymentsRes,
        messagesRes,
        notesRes,
      ] = await Promise.all([
        adminService.getProjectDetails(projectId),
        adminService.getProjectContract(projectId),
        adminService.getProjectMilestones(projectId),
        adminService.getProjectProgressUpdates(projectId),
        adminService.getProjectPaymentHistory(projectId),
        adminService.getProjectMessages(projectId),
        adminService.getProjectAdminNotes(projectId),
      ]);

      if (projectRes.success) {
        setProject(projectRes.data);
        setEditData({
          title: projectRes.data.title,
          description: projectRes.data.description,
          budget: projectRes.data.budget,
          status: projectRes.data.status,
        });
      }
      if (contractRes.success) {
        setContract(contractRes.data);
      }
      if (milestonesRes.success) {
        setMilestones(milestonesRes.data.milestones || milestonesRes.data || []);
      }
      if (progressRes.success) {
        setProgressUpdates(progressRes.data.updates || progressRes.data || []);
      }
      if (paymentsRes.success) {
        setPayments(paymentsRes.data.payments || paymentsRes.data || []);
      }
      if (messagesRes.success) {
        setMessages(messagesRes.data.messages || messagesRes.data || []);
      }
      if (notesRes.success) {
        setAdminNotes(notesRes.data.notes || notesRes.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    try {
      const response = await adminService.updateProject(projectId, editData);
      if (response.success) {
        toast.success('Project updated');
        setShowEditDialog(false);
        loadProjectDetails();
      }
    } catch (error: any) {
      toast.error('Failed to update project');
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    try {
      const response = await adminService.addProjectAdminNote(projectId, adminNote);
      if (response.success) {
        toast.success('Note added');
        setShowNoteDialog(false);
        setAdminNote('');
        loadProjectDetails();
      }
    } catch (error: any) {
      toast.error('Failed to add note');
    }
  };

  const handleDownloadContract = async () => {
    try {
      const blob = await adminService.downloadContractPDF(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contract downloaded');
    } catch (error: any) {
      toast.error('Failed to download contract');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      setup: { label: 'Setup', className: 'bg-blue-500' },
      active: { label: 'Active', className: 'bg-green-500' },
      completed: { label: 'Completed', className: 'bg-gray-500' },
      disputed: { label: 'Disputed', className: 'bg-red-500' },
      cancelled: { label: 'Cancelled', className: 'bg-orange-500' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Project not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const milestoneStatusBreakdown = {
    pending: milestones.filter((m) => m.status === 'pending').length,
    in_progress: milestones.filter((m) => m.status === 'in_progress').length,
    submitted: milestones.filter((m) => m.status === 'submitted').length,
    approved: milestones.filter((m) => m.status === 'approved').length,
    overdue: milestones.filter((m) => m.status === 'overdue').length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{project.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Project ID: {project.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(project.status)}
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-lg font-bold mt-1">
                  ${project.budget.toLocaleString()}
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
                <p className="text-sm text-gray-500">Completion</p>
                <p className="text-lg font-bold mt-1">{project.completion_percentage}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Released</p>
                <p className="text-lg font-bold mt-1">
                  ${project.payment_released.toLocaleString()}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-lg font-bold mt-1">
                  ${project.payment_pending.toLocaleString()}
                </p>
              </div>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="milestones">
            Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Owner</Label>
                  <p className="text-sm text-gray-700 mt-1">
                    {project.owner?.full_name || project.owner_id}
                  </p>
                </div>
                <div>
                  <Label>Contractor</Label>
                  <p className="text-sm text-gray-700 mt-1">
                    {project.contractor?.full_name || project.contractor_id}
                  </p>
                </div>
                <div>
                  <Label>Trade Type</Label>
                  <p className="text-sm text-gray-700 mt-1">{project.trade_type}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm text-gray-700 mt-1">
                    {format(new Date(project.start_date), 'PPP')}
                  </p>
                </div>
                {project.planned_completion_date && (
                  <div>
                    <Label>Planned Completion</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {format(new Date(project.planned_completion_date), 'PPP')}
                    </p>
                  </div>
                )}
                {project.actual_completion_date && (
                  <div>
                    <Label>Actual Completion</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {format(new Date(project.actual_completion_date), 'PPP')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestone Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{milestoneStatusBreakdown.pending}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {milestoneStatusBreakdown.in_progress}
                  </p>
                  <p className="text-sm text-gray-500">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {milestoneStatusBreakdown.submitted}
                  </p>
                  <p className="text-sm text-gray-500">Submitted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {milestoneStatusBreakdown.approved}
                  </p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {milestoneStatusBreakdown.overdue}
                  </p>
                  <p className="text-sm text-gray-500">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract">
          {contract ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contract Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadContract}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Generated At</Label>
                    <p className="text-sm text-gray-700 mt-1">
                      {format(new Date(contract.generated_at), 'PPP p')}
                    </p>
                  </div>
                  <div>
                    <Label>Model Used</Label>
                    <p className="text-sm text-gray-700 mt-1">{contract.model_used}</p>
                  </div>
                  <div>
                    <Label>Legal Review Status</Label>
                    <Badge className="mt-1">
                      {contract.legal_review_status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Signature Status</Label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">
                        Owner: {contract.signature_status.owner_signed ? '✓ Signed' : 'Pending'}
                      </p>
                      <p className="text-sm">
                        Contractor: {contract.signature_status.contractor_signed ? '✓ Signed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
                {contract.california_law_compliance && (
                  <div>
                    <Label>California Law Compliance</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        {contract.california_law_compliance.compliant ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {contract.california_law_compliance.compliant
                            ? 'Compliant'
                            : 'Non-Compliant'}
                        </span>
                      </div>
                      {contract.california_law_compliance.missing_provisions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-600">Missing Provisions:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {contract.california_law_compliance.missing_provisions.map(
                              (provision, idx) => (
                                <li key={idx}>{provision}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">No contract available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No milestones</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milestones.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell>{milestone.description}</TableCell>
                        <TableCell>
                          {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge>{milestone.status}</Badge>
                        </TableCell>
                        <TableCell>${milestone.payment_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/projects/${projectId}/milestones/${milestone.id}`
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {progressUpdates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No progress updates</p>
              ) : (
                <div className="space-y-4">
                  {progressUpdates.map((update) => (
                    <div key={update.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">
                          {format(new Date(update.update_date), 'PPP')}
                        </p>
                        {update.quality_issues_flagged && (
                          <Badge className="bg-red-500">Issues Flagged</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{update.description}</p>
                      {update.ai_analysis && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-xs font-medium mb-1">AI Analysis:</p>
                          <p className="text-xs text-gray-600">
                            {update.ai_analysis.overall_assessment}
                          </p>
                          {update.ai_analysis.quality_issues.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs font-medium text-red-600">Quality Issues:</p>
                              <ul className="list-disc list-inside text-xs text-gray-600">
                                {update.ai_analysis.quality_issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No payment records</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="capitalize">
                          {payment.type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge>{payment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Messages</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No messages</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {messages.map((msg) => (
                      <div key={msg.id} className="border rounded p-2">
                        <p className="text-sm font-medium">{msg.sender?.full_name || 'System'}</p>
                        <p className="text-xs text-gray-600">{msg.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(msg.created_at), 'MMM dd, yyyy p')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Admin Notes</CardTitle>
                  <Button size="sm" onClick={() => setShowNoteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {adminNotes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No admin notes</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {adminNotes.map((note) => (
                      <div key={note.id} className="border rounded p-2">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {note.created_by?.full_name || 'Admin'} •{' '}
                          {format(new Date(note.created_at), 'MMM dd, yyyy p')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
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
                <Label>Status</Label>
                <Select
                  value={editData.status || ''}
                  onValueChange={(value) => setEditData({ ...editData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setup">Setup</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject}>Save Changes</Button>
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
    </div>
  );
}


