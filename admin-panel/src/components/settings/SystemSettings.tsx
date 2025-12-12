import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Key, 
  Shield, 
  Users,
  Save,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState('api');
  const [showApiKey, setShowApiKey] = useState(false);

  const apiKeys = [
    { id: 1, name: 'Production API Key', key: 'pk_live_xxxxxxxxxxxxxxxx', created: '2024-01-15', lastUsed: '2024-11-12', status: 'active' },
    { id: 2, name: 'Development API Key', key: 'pk_test_xxxxxxxxxxxxxxxx', created: '2024-02-01', lastUsed: '2024-11-10', status: 'active' },
    { id: 3, name: 'Legacy API Key', key: 'pk_live_yyyyyyyyyyyyyyyy', created: '2023-11-20', lastUsed: '2024-10-15', status: 'inactive' },
  ];

  const featureFlags = [
    { id: 1, name: 'Enable Real-time Bidding', description: 'Allow contractors to see bids in real-time', enabled: true },
    { id: 2, name: 'Advanced Escrow Protection', description: 'Enable multi-tier escrow validation', enabled: true },
    { id: 3, name: 'AI-Powered Matching', description: 'Use AI to match contractors with projects', enabled: false },
    { id: 4, name: 'Video Consultations', description: 'Allow video calls between project managers and contractors', enabled: true },
    { id: 5, name: 'Blockchain Verification', description: 'Use blockchain for contract verification', enabled: false },
    { id: 6, name: 'Mobile Push Notifications', description: 'Send push notifications to mobile devices', enabled: true },
  ];

  const adminAccounts = [
    { id: 1, name: 'Admin User', email: 'admin@bidroom.com', role: 'Super Admin', status: 'active', lastLogin: '2024-11-12 15:30' },
    { id: 2, name: 'Jane Cooper', email: 'jane.cooper@bidroom.com', role: 'Admin', status: 'active', lastLogin: '2024-11-12 14:20' },
    { id: 3, name: 'Tom Wilson', email: 'tom.wilson@bidroom.com', role: 'Finance Manager', status: 'active', lastLogin: '2024-11-11 16:45' },
    { id: 4, name: 'Sarah Mitchell', email: 'sarah.mitchell@bidroom.com', role: 'Moderator', status: 'active', lastLogin: '2024-11-12 10:15' },
    { id: 5, name: 'David Brown', email: 'david.brown@bidroom.com', role: 'Support Agent', status: 'inactive', lastLogin: '2024-10-28 09:30' },
  ];

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-700">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and permissions</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* Warning Banner */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-orange-900">System Settings Access</p>
              <p className="text-orange-700 mt-1">
                You are accessing critical system settings. Changes made here can affect the entire platform. Please proceed with caution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="admins">Admin Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>API Key Management</CardTitle>
                {/* API Key creation/editing removed - read-only view only per FRD */}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>{apiKey.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded">
                            {showApiKey ? apiKey.key : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{apiKey.created}</TableCell>
                      <TableCell className="text-gray-600">{apiKey.lastUsed}</TableCell>
                      <TableCell>{getStatusBadge(apiKey.status)}</TableCell>
                      <TableCell>
                        {/* Read-only view - edit/delete actions removed per FRD */}
                        <Button variant="ghost" size="icon" title="Copy API Key">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-900">API Key Security</p>
                    <p className="text-blue-700 mt-1">
                      Store your API keys securely. Never commit them to version control or share them publicly. Rotate keys regularly for enhanced security.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags & Toggles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((feature) => (
                  <div key={feature.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3>{feature.name}</h3>
                        {feature.enabled ? (
                          <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{feature.description}</p>
                    </div>
                    <Switch checked={feature.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore tab removed per FRD - not in approved modules */}

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Administrator Accounts</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminAccounts.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {admin.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{admin.role}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(admin.status)}</TableCell>
                      <TableCell className="text-gray-600">{admin.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 space-y-4">
                <h3>Role Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Super Admin', 'Admin', 'Finance Manager', 'Moderator', 'Support Agent'].map((role) => (
                    <div key={role} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span>{role}</span>
                          <p className="text-gray-600 mt-1">
                            {role === 'Super Admin' && 'Full system access'}
                            {role === 'Admin' && 'User & project management'}
                            {role === 'Finance Manager' && 'Financial operations only'}
                            {role === 'Moderator' && 'Content moderation & disputes'}
                            {role === 'Support Agent' && 'Support desk access'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
