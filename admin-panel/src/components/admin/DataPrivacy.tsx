'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import { adminService, GDPRRequest } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Download, Trash2, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function DataPrivacy() {
  return (
    <Tabs defaultValue="gdpr" className="space-y-4">
      <TabsList>
        <TabsTrigger value="gdpr">GDPR Requests</TabsTrigger>
        <TabsTrigger value="consent">Consent Management</TabsTrigger>
        <TabsTrigger value="privacy">Privacy Controls</TabsTrigger>
      </TabsList>

      <TabsContent value="gdpr">
        <GDPRRequestsTab />
      </TabsContent>

      <TabsContent value="consent">
        <ConsentManagementTab />
      </TabsContent>

      <TabsContent value="privacy">
        <PrivacyControlsTab />
      </TabsContent>
    </Tabs>
  );
}

function GDPRRequestsTab() {
  const [exportRequests, setExportRequests] = useState<GDPRRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'export' | 'deletion'>('export');

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await adminService.getGDPRRequests(activeTab);
      if (response.success) {
        if (activeTab === 'export') {
          setExportRequests(response.data.requests || response.data || []);
        } else {
          setDeletionRequests(response.data.requests || response.data || []);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load GDPR requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await adminService.processGDPRRequest(requestId, action);
      toast.success(`Request ${action}d`);
      loadRequests();
    } catch (error: any) {
      toast.error(`Failed to ${action} request`);
    }
  };

  const requests = activeTab === 'export' ? exportRequests : deletionRequests;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'export' ? 'default' : 'outline'}
          onClick={() => setActiveTab('export')}
        >
          Export Requests
        </Button>
        <Button
          variant={activeTab === 'deletion' ? 'default' : 'outline'}
          onClick={() => setActiveTab('deletion')}
        >
          Deletion Requests
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'export' ? 'Data Export Requests' : 'Data Deletion Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.user?.full_name || request.user_id}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.requested_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessRequest(request.id, 'approve')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessRequest(request.id, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {activeTab === 'export' && request.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConsentManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Consent management configuration interface
        </p>
      </CardContent>
    </Card>
  );
}

function PrivacyControlsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Privacy controls and data anonymization tools
        </p>
      </CardContent>
    </Card>
  );
}


