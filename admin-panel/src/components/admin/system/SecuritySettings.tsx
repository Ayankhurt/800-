'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Textarea } from '../../ui/textarea';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function SecuritySettings() {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAuthenticationSettings();
      if (response.success) {
        // Merge with defaults to ensure no undefined values
        setSettings(prev => ({ ...prev, ...(response.data || {}) }));
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
      await adminService.updateAuthenticationSettings(settings);
      toast.success('Security settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Password Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Password Requirements</h3>
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
        </div>

        {/* Session & Authentication */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Session & Authentication</h3>
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
            <div>
              <Label>Two-Factor Authentication (2FA)</Label>
              <p className="text-sm text-gray-500">Enforce 2FA for all admin users</p>
            </div>
            <Switch
              checked={settings.mfa_enforcement}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, mfa_enforcement: checked })
              }
            />
          </div>
        </div>

        {/* Login Protection */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Login Protection</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Failed Login Attempt Limit</Label>
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
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


