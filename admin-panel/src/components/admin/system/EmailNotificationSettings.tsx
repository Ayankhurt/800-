'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save, Mail, Bell } from 'lucide-react';

export default function EmailNotificationSettings() {
  return (
    <Tabs defaultValue="email" className="space-y-4">
      <TabsList>
        <TabsTrigger value="email">Email Settings</TabsTrigger>
        <TabsTrigger value="templates">Email Templates</TabsTrigger>
        <TabsTrigger value="push">Push Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="email">
        <EmailSettingsTab />
      </TabsContent>

      <TabsContent value="templates">
        <EmailTemplatesTab />
      </TabsContent>

      <TabsContent value="push">
        <PushNotificationSettingsTab />
      </TabsContent>
    </Tabs>
  );
}

function EmailSettingsTab() {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    sender_name: '',
    sender_email: '',
    reply_to: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateEmailSettings(settings);
      toast.success('Email settings saved');
    } catch (error: any) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SMTP Host</Label>
            <Input
              value={settings.smtp_host}
              onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
              placeholder="smtp.example.com"
            />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input
              type="number"
              value={settings.smtp_port}
              onChange={(e) =>
                setSettings({ ...settings, smtp_port: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>SMTP Username</Label>
            <Input
              value={settings.smtp_username}
              onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
            />
          </div>
          <div>
            <Label>SMTP Password</Label>
            <Input
              type="password"
              value={settings.smtp_password}
              onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
            />
          </div>
          <div>
            <Label>Sender Name</Label>
            <Input
              value={settings.sender_name}
              onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Sender Email</Label>
            <Input
              type="email"
              value={settings.sender_email}
              onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
            />
          </div>
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

function EmailTemplatesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Email template management interface
        </p>
      </CardContent>
    </Card>
  );
}

function PushNotificationSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Push notification configuration interface
        </p>
      </CardContent>
    </Card>
  );
}


