'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Key, Globe, CreditCard, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Badge } from '../../ui/badge';

export default function SystemConfiguration() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="general">General Settings</TabsTrigger>
        <TabsTrigger value="features">Feature Flags</TabsTrigger>
        <TabsTrigger value="api">API Configuration</TabsTrigger>
        <TabsTrigger value="payment">Payment Configuration</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralSettingsTab />
      </TabsContent>

      <TabsContent value="features">
        <FeatureFlagsTab />
      </TabsContent>

      <TabsContent value="api">
        <APIConfigurationTab />
      </TabsContent>

      <TabsContent value="payment">
        <PaymentConfigurationTab />
      </TabsContent>
    </Tabs>
  );
}

function GeneralSettingsTab() {
  const [settings, setSettings] = useState({
    platform_name: '',
    support_email: '',
    support_phone: '',
    business_hours: '',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemSettings();
      if (response.success) {
        setSettings(response.data.settings || response.data || settings);
      }
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminService.updateSystemSettings(settings);
      if (response.success) {
        toast.success('Settings saved successfully');
      }
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Platform Name</Label>
          <Input
            value={settings.platform_name}
            onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
            placeholder="Enter platform name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Support Email</Label>
            <Input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              placeholder="support@example.com"
            />
          </div>
          <div>
            <Label>Support Phone</Label>
            <Input
              type="tel"
              value={settings.support_phone}
              onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
        <div>
          <Label>Business Hours</Label>
          <Input
            value={settings.business_hours}
            onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
            placeholder="Mon-Fri 9AM-5PM PST"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => setSettings({ ...settings, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureFlagsTab() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<any>(null);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFeatureFlags();
      if (response.success) {
        setFlags(response.data.flags || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      await adminService.updateFeatureFlag(flagId, { enabled });
      toast.success('Feature flag updated');
      loadFlags();
    } catch (error: any) {
      toast.error('Failed to update feature flag');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature Name</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Beta Access</TableHead>
                <TableHead>Rollout %</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No feature flags found
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-medium">{flag.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(checked) => handleToggleFlag(flag.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      {flag.beta_access ? (
                        <Badge className="bg-blue-500">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>{flag.rollout_percentage || 0}%</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingFlag(flag);
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
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
  );
}

function APIConfigurationTab() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [rateLimiting, setRateLimiting] = useState({
    requests_per_minute: 60,
    requests_per_hour: 1000,
    requests_per_day: 10000,
  });
  const [loading, setLoading] = useState(true);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);

  useEffect(() => {
    loadAPIConfig();
  }, []);

  const loadAPIConfig = async () => {
    try {
      setLoading(true);
      const [configRes, keysRes, webhooksRes] = await Promise.all([
        adminService.getAPIConfiguration(),
        adminService.getAPIConfiguration(), // Assuming this returns keys
        adminService.getAPIConfiguration(), // Assuming this returns webhooks
      ]);
      // Handle responses
    } catch (error: any) {
      toast.error('Failed to load API configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API Keys</CardTitle>
            <Button onClick={() => setShowKeyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No API keys found
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Are you sure you want to revoke this API key?')) {
                            try {
                              await adminService.revokeAPIKey(key.id);
                              toast.success('API key revoked');
                              loadAPIConfig();
                            } catch (error: any) {
                              toast.error('Failed to revoke API key');
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Requests per Minute</Label>
              <Input
                type="number"
                value={rateLimiting.requests_per_minute}
                onChange={(e) =>
                  setRateLimiting({
                    ...rateLimiting,
                    requests_per_minute: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Requests per Hour</Label>
              <Input
                type="number"
                value={rateLimiting.requests_per_hour}
                onChange={(e) =>
                  setRateLimiting({
                    ...rateLimiting,
                    requests_per_hour: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Requests per Day</Label>
              <Input
                type="number"
                value={rateLimiting.requests_per_day}
                onChange={(e) =>
                  setRateLimiting({
                    ...rateLimiting,
                    requests_per_day: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  await adminService.updateRateLimiting(rateLimiting);
                  toast.success('Rate limiting updated');
                } catch (error: any) {
                  toast.error('Failed to update rate limiting');
                }
              }}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Webhooks</CardTitle>
            <Button onClick={() => setShowWebhookDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No webhooks found
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm">{webhook.url}</TableCell>
                    <TableCell>
                      <Badge>{webhook.events.length} events</Badge>
                    </TableCell>
                    <TableCell>
                      {webhook.active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentConfigurationTab() {
  const [config, setConfig] = useState({
    processor: 'stripe',
    platform_commission: 5,
    payment_processing_fee: 2.9,
    escrow_fee: 0,
    payout_schedule: 'daily',
    minimum_transaction_amount: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPaymentConfiguration();
      if (response.success) {
        setConfig(response.data.config || response.data || config);
      }
    } catch (error: any) {
      toast.error('Failed to load payment configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminService.updatePaymentConfiguration(config);
      if (response.success) {
        toast.success('Payment configuration saved');
      }
    } catch (error: any) {
      toast.error('Failed to save payment configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Payment Processor</Label>
          <Select
            value={config.processor}
            onValueChange={(value) => setConfig({ ...config, processor: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Platform Commission (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={config.platform_commission}
              onChange={(e) =>
                setConfig({ ...config, platform_commission: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Payment Processing Fee (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={config.payment_processing_fee}
              onChange={(e) =>
                setConfig({ ...config, payment_processing_fee: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Escrow Fee (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={config.escrow_fee}
              onChange={(e) =>
                setConfig({ ...config, escrow_fee: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Minimum Transaction Amount ($)</Label>
            <Input
              type="number"
              value={config.minimum_transaction_amount}
              onChange={(e) =>
                setConfig({ ...config, minimum_transaction_amount: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div>
          <Label>Payout Schedule</Label>
          <Select
            value={config.payout_schedule}
            onValueChange={(value) => setConfig({ ...config, payout_schedule: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


