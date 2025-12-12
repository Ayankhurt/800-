'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Database, Download, Upload, Settings } from 'lucide-react';

export default function DatabaseManagement() {
  const [backups, setBackups] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, backupsRes] = await Promise.all([
        adminService.getDatabaseStatus(),
        adminService.getDatabaseBackups(),
      ]);
      if (statusRes.success) {
        setStatus(statusRes.data);
      }
      if (backupsRes.success) {
        setBackups(backupsRes.data.backups || backupsRes.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load database information');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await adminService.createDatabaseBackup();
      toast.success('Backup created successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to create backup');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-bold text-green-600">Healthy</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p className="text-lg font-bold">{status.size || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Backup</p>
              <p className="text-lg font-bold">
                {backups[0]?.created_at
                  ? new Date(backups[0].created_at).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Backups</CardTitle>
            <Button onClick={handleCreateBackup}>
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No backups found</p>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{backup.name || backup.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(backup.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Soft Delete Enabled</Label>
            <Switch defaultChecked />
          </div>
          <div>
            <Label>Hard Delete After (days)</Label>
            <Input type="number" defaultValue={90} />
          </div>
          <div>
            <Label>Archive After (days)</Label>
            <Input type="number" defaultValue={365} />
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}


