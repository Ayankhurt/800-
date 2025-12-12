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
import { adminService, ReferralProgram } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Save, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

export default function ReferralProgramManagement() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="tracking">Tracking</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ReferralOverviewTab />
      </TabsContent>

      <TabsContent value="settings">
        <ReferralSettingsTab />
      </TabsContent>

      <TabsContent value="tracking">
        <ReferralTrackingTab />
      </TabsContent>
    </Tabs>
  );
}

function ReferralOverviewTab() {
  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgram();
  }, []);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReferralProgram();
      if (response.success) {
        setProgram(response.data.program || response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load referral program');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !program) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Campaigns</p>
                <p className="text-xl font-bold mt-1">{program.active_campaigns}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Referrals</p>
                <p className="text-xl font-bold mt-1">{program.total_referrals}</p>
              </div>
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Conversion Rate</p>
                <p className="text-xl font-bold mt-1">{program.conversion_rate}%</p>
              </div>
              <Award className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Rewards Distributed</p>
                <p className="text-xl font-bold mt-1">
                  ${program.rewards_distributed.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Rewards Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {program.top_referrers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No referrers yet
                  </TableCell>
                </TableRow>
              ) : (
                program.top_referrers.map((referrer) => (
                  <TableRow key={referrer.user_id}>
                    <TableCell>
                      {referrer.user?.full_name || referrer.user_id}
                    </TableCell>
                    <TableCell>{referrer.referrals_count}</TableCell>
                    <TableCell>${referrer.rewards_earned.toLocaleString()}</TableCell>
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

function ReferralSettingsTab() {
  const [settings, setSettings] = useState({
    reward_amount: 0,
    expiration_days: 30,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateReferralSettings(settings);
      toast.success('Referral settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Program Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Reward Amount ($)</Label>
          <Input
            type="number"
            value={settings.reward_amount}
            onChange={(e) =>
              setSettings({ ...settings, reward_amount: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>Expiration Days</Label>
          <Input
            type="number"
            value={settings.expiration_days}
            onChange={(e) =>
              setSettings({ ...settings, expiration_days: Number(e.target.value) })
            }
          />
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

function ReferralTrackingTab() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();
  }, []);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReferralTracking();
      if (response.success) {
        setReferrals(response.data.referrals || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load referral tracking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>{referral.referrer?.full_name || referral.referrer_id}</TableCell>
                    <TableCell>{referral.referred_user?.full_name || referral.referred_user_id}</TableCell>
                    <TableCell>
                      <Badge>{referral.status}</Badge>
                    </TableCell>
                    <TableCell>${referral.reward_amount || 0}</TableCell>
                    <TableCell>
                      {new Date(referral.created_at).toLocaleDateString()}
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


