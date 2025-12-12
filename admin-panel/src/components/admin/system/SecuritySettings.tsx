'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Textarea } from '../../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save, Lock, Shield, Key } from 'lucide-react';

export default function SecuritySettings() {
  return (
    <Tabs defaultValue="authentication" className="space-y-4">
      <TabsList>
        <TabsTrigger value="authentication">Authentication</TabsTrigger>
        <TabsTrigger value="encryption">Encryption</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
      </TabsList>

      <TabsContent value="authentication">
        <AuthenticationSettingsTab />
      </TabsContent>

      <TabsContent value="encryption">
        <EncryptionSettingsTab />
      </TabsContent>

      <TabsContent value="permissions">
        <PermissionsSettingsTab />
      </TabsContent>
    </Tabs>
  );
}

function AuthenticationSettingsTab() {
  const [settings, setSettings] = useState({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    session_timeout_minutes: 60,
    mfa_enforcement: false,
    login_attempt_limit: 5,
    login_lockout_duration_minutes: 15,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateAuthenticationSettings(settings);
      toast.success('Authentication settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Minimum Length</Label>
          <Input
            type="number"
            value={settings.password_min_length}
            onChange={(e) =>
              setSettings({ ...settings, password_min_length: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Require Uppercase</Label>
            <Switch
              checked={settings.password_require_uppercase}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, password_require_uppercase: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Require Lowercase</Label>
            <Switch
              checked={settings.password_require_lowercase}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, password_require_lowercase: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Require Numbers</Label>
            <Switch
              checked={settings.password_require_numbers}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, password_require_numbers: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Require Symbols</Label>
            <Switch
              checked={settings.password_require_symbols}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, password_require_symbols: checked })
              }
            />
          </div>
        </div>
        <div>
          <Label>Session Timeout (minutes)</Label>
          <Input
            type="number"
            value={settings.session_timeout_minutes}
            onChange={(e) =>
              setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>MFA Enforcement</Label>
          <Switch
            checked={settings.mfa_enforcement}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, mfa_enforcement: checked })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Login Attempt Limit</Label>
            <Input
              type="number"
              value={settings.login_attempt_limit}
              onChange={(e) =>
                setSettings({ ...settings, login_attempt_limit: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Lockout Duration (minutes)</Label>
            <Input
              type="number"
              value={settings.login_lockout_duration_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  login_lockout_duration_minutes: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div>
          <Label>IP Whitelist (one per line)</Label>
          <Textarea rows={4} placeholder="192.168.1.1&#10;10.0.0.1" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EncryptionSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Encryption Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Data Encryption Enabled</Label>
          <Switch defaultChecked />
        </div>
        <div>
          <Label>SSL/TLS Version</Label>
          <Input defaultValue="TLS 1.3" />
        </div>
        <div>
          <Label>Key Rotation (days)</Label>
          <Input type="number" defaultValue={90} />
        </div>
        <Button>Save Settings</Button>
      </CardContent>
    </Card>
  );
}

function PermissionsSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Role and resource permissions management interface
        </p>
      </CardContent>
    </Card>
  );
}


