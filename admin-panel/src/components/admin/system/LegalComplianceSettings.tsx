'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save, FileText, Shield, Download } from 'lucide-react';

export default function LegalComplianceSettings() {
  const [activeTab, setActiveTab] = useState('terms');
  const [documents, setDocuments] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLegalDocuments();
      if (response.success) {
        setDocuments(response.data.documents || response.data || {});
      }
    } catch (error: any) {
      toast.error('Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (docType: string, content: string) => {
    try {
      await adminService.updateLegalDocument(docType, content);
      toast.success(`${docType} saved successfully`);
    } catch (error: any) {
      toast.error(`Failed to save ${docType}`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="terms">Terms of Service</TabsTrigger>
        <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
        <TabsTrigger value="cookie">Cookie Policy</TabsTrigger>
        <TabsTrigger value="acceptable">Acceptable Use</TabsTrigger>
        <TabsTrigger value="compliance">Compliance Tools</TabsTrigger>
      </TabsList>

      <TabsContent value="terms">
        <DocumentEditor
          title="Terms of Service"
          content={documents.terms_of_service || ''}
          onSave={(content) => handleSave('terms_of_service', content)}
        />
      </TabsContent>

      <TabsContent value="privacy">
        <DocumentEditor
          title="Privacy Policy"
          content={documents.privacy_policy || ''}
          onSave={(content) => handleSave('privacy_policy', content)}
        />
      </TabsContent>

      <TabsContent value="cookie">
        <DocumentEditor
          title="Cookie Policy"
          content={documents.cookie_policy || ''}
          onSave={(content) => handleSave('cookie_policy', content)}
        />
      </TabsContent>

      <TabsContent value="acceptable">
        <DocumentEditor
          title="Acceptable Use Policy"
          content={documents.acceptable_use || ''}
          onSave={(content) => handleSave('acceptable_use', content)}
        />
      </TabsContent>

      <TabsContent value="compliance">
        <ComplianceTools />
      </TabsContent>
    </Tabs>
  );
}

function DocumentEditor({ title, content, onSave }: { title: string; content: string; onSave: (content: string) => void }) {
  const [localContent, setLocalContent] = useState(content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(localContent);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Content</Label>
          <Textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            rows={20}
            className="font-mono text-sm"
            placeholder="Enter document content..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">View History</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceTools() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GDPR Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Data Retention Period (days)</Label>
            <Input type="number" defaultValue={365} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export User Data</Button>
            <Button variant="outline">Configure Consent Management</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <Label>Auto-delete enabled</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <Label>Archive enabled</Label>
          </div>
          <Button>Save Policy</Button>
        </CardContent>
      </Card>
    </div>
  );
}


