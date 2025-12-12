'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
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
  adminService,
  IdentityVerification,
} from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Download,
  Eye,
  User,
  Calendar,
  MapPin,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface IdentityVerificationProps {
  verificationId: string;
}

export default function IdentityVerificationComponent({ verificationId }: IdentityVerificationProps) {
  const router = useRouter();
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDocumentTypes, setRequestDocumentTypes] = useState<string[]>([]);
  const [flagReason, setFlagReason] = useState('');
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);

  useEffect(() => {
    loadVerification();
  }, [verificationId]);

  const loadVerification = async () => {
    try {
      setLoading(true);
      const response = await adminService.getIdentityVerificationDetails(verificationId);
      if (response.success) {
        setVerification(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load verification details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await adminService.approveIdentityVerification(
        verificationId,
        approveNotes
      );
      if (response.success) {
        toast.success('Identity verification approved');
        setShowApproveDialog(false);
        setApproveNotes('');
        loadVerification();
      }
    } catch (error: any) {
      toast.error('Failed to approve verification');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      const response = await adminService.rejectIdentityVerification(
        verificationId,
        rejectReason
      );
      if (response.success) {
        toast.success('Identity verification rejected');
        setShowRejectDialog(false);
        setRejectReason('');
        loadVerification();
      }
    } catch (error: any) {
      toast.error('Failed to reject verification');
    }
  };

  const handleRequestDocuments = async () => {
    if (requestDocumentTypes.length === 0 || !requestMessage.trim()) {
      toast.error('Please select document types and provide a message');
      return;
    }
    try {
      const response = await adminService.requestAdditionalDocuments(
        verificationId,
        requestDocumentTypes,
        requestMessage
      );
      if (response.success) {
        toast.success('Document request sent');
        setShowRequestDialog(false);
        setRequestDocumentTypes([]);
        setRequestMessage('');
        loadVerification();
      }
    } catch (error: any) {
      toast.error('Failed to request documents');
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      const response = await adminService.flagForManualReview(
        verificationId,
        flagReason
      );
      if (response.success) {
        toast.success('Verification flagged for manual review');
        setShowFlagDialog(false);
        setFlagReason('');
        loadVerification();
      }
    } catch (error: any) {
      toast.error('Failed to flag verification');
    }
  };

  const handleValidateDocument = async (documentId: string) => {
    try {
      const response = await adminService.validateDocument(verificationId, documentId);
      if (response.success) {
        toast.success('Document validated');
        loadVerification();
      }
    } catch (error: any) {
      toast.error('Failed to validate document');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'government_id':
        return 'Government ID';
      case 'selfie':
        return 'Selfie/Photo';
      case 'business_registration':
        return 'Business Registration';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500' },
      approved: { label: 'Approved', className: 'bg-green-500' },
      rejected: { label: 'Rejected', className: 'bg-red-500' },
      flagged: { label: 'Flagged', className: 'bg-orange-500' },
    };
    const c = config[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Verification not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

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
            <h1 className="text-2xl md:text-3xl font-bold">Identity Verification</h1>
            <p className="text-sm text-gray-600 mt-1">
              Verification ID: {verification.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(verification.status)}
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{verification.user?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{verification.user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium">{verification.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="font-medium">
                {format(new Date(verification.submitted_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Match Check */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Match Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {verification.profile_match.name_match ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Name Match</span>
            </div>
            <div className="flex items-center gap-2">
              {verification.profile_match.dob_match ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Date of Birth Match</span>
            </div>
            <div className="flex items-center gap-2">
              {verification.profile_match.address_match ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Address Match</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submitted Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verification.documents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No documents submitted</p>
            ) : (
              verification.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded">
                      {doc.type === 'selfie' ? (
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{getDocumentTypeLabel(doc.type)}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                      </p>
                      {doc.expiration_date && (
                        <p className="text-sm text-gray-500">
                          Expires: {format(new Date(doc.expiration_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {doc.validation_notes && (
                        <p className="text-sm text-orange-600 mt-1">
                          {doc.validation_notes}
                        </p>
                      )}
                    </div>
                    <div>
                      {doc.validated ? (
                        <Badge className="bg-green-500">Validated</Badge>
                      ) : (
                        <Badge variant="secondary">Not Validated</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingDocument(doc.url)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {!doc.validated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateDocument(doc.id)}
                      >
                        Validate
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="bg-green-600 hover:bg-green-700"
              disabled={verification.status === 'approved'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              variant="destructive"
              disabled={verification.status === 'rejected'}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => setShowRequestDialog(true)}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Request Documents
            </Button>
            <Button
              onClick={() => setShowFlagDialog(true)}
              variant="outline"
              disabled={verification.status === 'flagged'}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Flag for Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Notes */}
      {verification.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {verification.notes}
            </p>
            {verification.reviewed_by && (
              <p className="text-xs text-gray-500 mt-2">
                Reviewed by {verification.reviewed_by.full_name} on{' '}
                {verification.reviewed_at
                  ? format(new Date(verification.reviewed_at), 'MMM dd, yyyy')
                  : '-'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Identity Verification</DialogTitle>
            <DialogDescription>
              Approve this identity verification. You can add optional notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={4}
                placeholder="Add approval notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Identity Verification</DialogTitle>
            <DialogDescription>
              Reject this identity verification. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter rejection reason..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              variant="destructive"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Documents Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Documents</DialogTitle>
            <DialogDescription>
              Request additional documents from the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Document Types *</Label>
              <div className="space-y-2 mt-2">
                {['government_id', 'selfie', 'business_registration'].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={requestDocumentTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRequestDocumentTypes([...requestDocumentTypes, type]);
                        } else {
                          setRequestDocumentTypes(
                            requestDocumentTypes.filter((t) => t !== type)
                          );
                        }
                      }}
                    />
                    <Label>{getDocumentTypeLabel(type)}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                placeholder="Enter message to user..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestDocuments}
              disabled={requestDocumentTypes.length === 0 || !requestMessage.trim()}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag for Manual Review</DialogTitle>
            <DialogDescription>
              Flag this verification for additional manual review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for flagging..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFlagDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlag}
              disabled={!flagReason.trim()}
            >
              Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {viewingDocument && (
              <img
                src={viewingDocument}
                alt="Document"
                className="w-full h-auto rounded"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingDocument(null)}
            >
              Close
            </Button>
            <Button onClick={() => viewingDocument && window.open(viewingDocument, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


