'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save, Search, FileText, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export default function SEOManagement() {
  return (
    <Tabs defaultValue="settings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="settings">SEO Settings</TabsTrigger>
        <TabsTrigger value="content">Content Optimization</TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <SEOSettingsTab />
      </TabsContent>

      <TabsContent value="content">
        <ContentOptimizationTab />
      </TabsContent>
    </Tabs>
  );
}

function SEOSettingsTab() {
  const [settings, setSettings] = useState({
    sitemap_enabled: true,
    robots_txt: '',
    meta_tags: {},
    schema_markup: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSEOSettings();
      if (response.success) {
        setSettings(response.data.settings || response.data || settings);
      }
    } catch (error: any) {
      toast.error('Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSEOSettings(settings);
      toast.success('SEO settings saved');
    } catch (error: any) {
      toast.error('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      await adminService.generateSitemap();
      toast.success('Sitemap generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate sitemap');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SEO Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Sitemap Enabled</Label>
            <Switch
              checked={settings.sitemap_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, sitemap_enabled: checked })
              }
            />
          </div>
          <div>
            <Label>Robots.txt</Label>
            <Textarea
              value={settings.robots_txt}
              onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
              rows={6}
              className="font-mono text-sm"
              placeholder="User-agent: *&#10;Allow: /"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateSitemap} variant="outline">
              Generate Sitemap
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentOptimizationTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Optimization</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-500 py-8">
          Content optimization and keyword tracking interface
        </p>
      </CardContent>
    </Card>
  );
}


