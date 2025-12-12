'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
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
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Settings, BarChart3, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function AnalyticsIntegration() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any>(null);
  const [formData, setFormData] = useState({
    api_key: '',
    tracking_id: '',
    enabled: false,
    events: [] as string[],
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAnalyticsIntegrations();
      if (response.success) {
        setIntegrations(response.data.integrations || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load analytics integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingIntegration) return;
    try {
      await adminService.configureAnalyticsIntegration(
        editingIntegration.provider,
        formData
      );
      toast.success('Integration updated');
      setShowDialog(false);
      loadIntegrations();
    } catch (error: any) {
      toast.error('Failed to update integration');
    }
  };

  const handleEdit = (integration: any) => {
    setEditingIntegration(integration);
    setFormData({
      api_key: integration.api_key || '',
      tracking_id: integration.tracking_id || '',
      enabled: integration.enabled || false,
      events: integration.events || [],
    });
    setShowDialog(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Analytics Integration</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Configure third-party analytics integrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No integrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium capitalize">
                        {integration.provider}
                      </TableCell>
                      <TableCell>
                        {integration.enabled ? (
                          <Badge className="bg-green-500">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {integration.tracking_id || '-'}
                      </TableCell>
                      <TableCell>
                        {integration.events?.length || 0} events
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(integration)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Configure {editingIntegration?.provider || 'Analytics'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Enter API key"
              />
            </div>
            <div>
              <Label>Tracking ID</Label>
              <Input
                value={formData.tracking_id}
                onChange={(e) => setFormData({ ...formData, tracking_id: e.target.value })}
                placeholder="Enter tracking ID"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


