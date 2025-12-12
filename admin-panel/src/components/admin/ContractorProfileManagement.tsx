'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Award,
  Calendar,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
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
import { Input } from '../ui/input';

export default function ContractorProfileManagement() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [contractor, setContractor] = useState<any>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectItemId, setRejectItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState<'portfolio' | 'endorsement'>('portfolio');

  useEffect(() => {
    if (userId) {
      loadContractorData();
    }
  }, [userId]);

  const loadContractorData = async () => {
    try {
      setLoading(true);
      const [profileRes, portfolioRes, endorsementsRes, certsRes] = await Promise.all([
        adminService.getContractorProfile(userId),
        adminService.getPortfolioItems(userId),
        adminService.getEndorsements(userId),
        adminService.getCertifications(userId),
      ]);

      if (profileRes.success) setContractor(profileRes.data);
      if (portfolioRes.success) setPortfolioItems(portfolioRes.data || []);
      if (endorsementsRes.success) setEndorsements(endorsementsRes.data || []);
      if (certsRes.success) setCertifications(certsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to load contractor data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePortfolio = async (itemId: string) => {
    try {
      const response = await adminService.approvePortfolioItem(userId, itemId);
      if (response.success) {
        toast.success('Portfolio item approved');
        loadContractorData();
      }
    } catch (error: any) {
      toast.error('Failed to approve portfolio item');
    }
  };

  const handleRejectPortfolio = async () => {
    if (!rejectItemId || !rejectReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const response = await adminService.rejectPortfolioItem(
        userId,
        rejectItemId,
        rejectReason
      );
      if (response.success) {
        toast.success('Portfolio item rejected');
        setShowRejectDialog(false);
        setRejectItemId(null);
        setRejectReason('');
        loadContractorData();
      }
    } catch (error: any) {
      toast.error('Failed to reject portfolio item');
    }
  };

  const handleFlagPortfolio = async (itemId: string) => {
    const reason = prompt('Enter reason for flagging:');
    if (reason) {
      try {
        const response = await adminService.flagPortfolioItem(userId, itemId, reason);
        if (response.success) {
          toast.success('Portfolio item flagged');
          loadContractorData();
        }
      } catch (error: any) {
        toast.error('Failed to flag portfolio item');
      }
    }
  };

  const handleVerifyEndorsement = async (endorsementId: string) => {
    try {
      const response = await adminService.verifyEndorsement(userId, endorsementId);
      if (response.success) {
        toast.success('Endorsement verified');
        loadContractorData();
      }
    } catch (error: any) {
      toast.error('Failed to verify endorsement');
    }
  };

  const handleRemoveEndorsement = async (endorsementId: string) => {
    const reason = prompt('Enter reason for removal:');
    if (reason) {
      try {
        const response = await adminService.removeEndorsement(
          userId,
          endorsementId,
          reason
        );
        if (response.success) {
          toast.success('Endorsement removed');
          loadContractorData();
        }
      } catch (error: any) {
        toast.error('Failed to remove endorsement');
      }
    }
  };

  const handleVerifyCertification = async (certificationId: string) => {
    try {
      const response = await adminService.verifyCertification(userId, certificationId);
      if (response.success) {
        toast.success('Certification verified');
        loadContractorData();
      }
    } catch (error: any) {
      toast.error('Failed to verify certification');
    }
  };

  const handleSetReminder = async (certificationId: string) => {
    const days = prompt('Enter days before expiration to send reminder:');
    if (days && !isNaN(Number(days))) {
      try {
        const response = await adminService.setCertificationReminder(
          userId,
          certificationId,
          Number(days)
        );
        if (response.success) {
          toast.success('Reminder set');
          loadContractorData();
        }
      } catch (error: any) {
        toast.error('Failed to set reminder');
      }
    }
  };

  const handleApproveProfileChanges = async () => {
    try {
      const response = await adminService.reviewProfileChanges(userId, 'approve');
      if (response.success) {
        toast.success('Profile changes approved');
        loadContractorData();
      }
    } catch (error: any) {
      toast.error('Failed to approve profile changes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contractor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/users/${userId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Profile
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Contractor Profile Management
            </h1>
            <p className="text-sm text-gray-600">
              {contractor?.full_name || contractor?.email}
            </p>
          </div>
        </div>
        {contractor?.pending_changes && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const notes = prompt('Enter rejection notes (optional):');
                try {
                  const response = await adminService.reviewProfileChanges(
                    userId,
                    'reject',
                    notes || undefined
                  );
                  if (response.success) {
                    toast.success('Profile changes rejected');
                    loadContractorData();
                  }
                } catch (error: any) {
                  toast.error('Failed to reject profile changes');
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Changes
            </Button>
            <Button onClick={handleApproveProfileChanges}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve Changes
            </Button>
          </div>
        )}
      </div>

      {/* Pending Changes Alert */}
      {contractor?.pending_changes && (
        <Card className="border-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">
                This contractor has pending profile changes awaiting review.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="endorsements">Endorsements</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Items ({portfolioItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No portfolio items</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-48 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                item.status === 'approved'
                                  ? 'bg-green-500'
                                  : item.status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {item.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprovePortfolio(item.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectItemId(item.id);
                                    setRejectType('portfolio');
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlagPortfolio(item.id)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Flag
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endorsements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endorsements ({endorsements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {endorsements.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No endorsements</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endorser</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endorsements.map((endorsement) => (
                      <TableRow key={endorsement.id}>
                        <TableCell>
                          {endorsement.endorser?.full_name || endorsement.endorser?.email}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{endorsement.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              endorsement.verified
                                ? 'bg-green-500'
                                : 'bg-yellow-500'
                            }
                          >
                            {endorsement.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {endorsement.created_at
                            ? format(new Date(endorsement.created_at), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!endorsement.verified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleVerifyEndorsement(endorsement.id)
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() =>
                                handleRemoveEndorsement(endorsement.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certifications ({certifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {certifications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No certifications</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certification</TableHead>
                      <TableHead>Issuing Authority</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certifications.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-sm text-gray-500">
                              License #: {cert.license_number || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{cert.issuing_authority || '-'}</TableCell>
                        <TableCell>
                          {cert.expiration_date
                            ? format(new Date(cert.expiration_date), 'MMM dd, yyyy')
                            : 'No expiration'}
                          {cert.expiration_date &&
                            new Date(cert.expiration_date) < new Date() && (
                              <Badge className="ml-2 bg-red-500">Expired</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              cert.verified
                                ? 'bg-green-500'
                                : cert.status === 'expired'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }
                          >
                            {cert.verified
                              ? 'Verified'
                              : cert.status || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!cert.verified && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyCertification(cert.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetReminder(cert.id)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Set Reminder
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectType === 'portfolio' ? 'Portfolio Item' : 'Endorsement'}</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectItemId(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRejectPortfolio} disabled={!rejectReason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


