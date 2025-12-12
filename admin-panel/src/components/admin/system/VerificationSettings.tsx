'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function VerificationSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getVerificationSettings();
      if (response.success) {
        setSettings(response.data.settings || response.data || {});
      }
    } catch (error: any) {
      toast.error('Failed to load verification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateVerificationSettings(settings);
      toast.success('Verification settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch
              checked={settings.identity_verification?.enabled || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  identity_verification: {
                    ...settings.identity_verification,
                    enabled: checked,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Required</Label>
            <Switch
              checked={settings.identity_verification?.required || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  identity_verification: {
                    ...settings.identity_verification,
                    required: checked,
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Expiration Days</Label>
            <Input
              type="number"
              value={settings.identity_verification?.expiration_days || 365}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  identity_verification: {
                    ...settings.identity_verification,
                    expiration_days: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch
              checked={settings.license_verification?.enabled || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  license_verification: {
                    ...settings.license_verification,
                    enabled: checked,
                  },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Required</Label>
            <Switch
              checked={settings.license_verification?.required || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  license_verification: {
                    ...settings.license_verification,
                    required: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch
              checked={settings.background_check?.enabled || false}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  background_check: {
                    ...settings.background_check,
                    enabled: checked,
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Provider</Label>
            <Input
              value={settings.background_check?.provider || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  background_check: {
                    ...settings.background_check,
                    provider: e.target.value,
                  },
                })
              }
              placeholder="Checkr, Sterling, etc."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}


