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

export default function TrustScoreConfiguration() {
  const [config, setConfig] = useState({
    weights: {
      verification_status: 25,
      reviews_ratings: 30,
      project_completion_rate: 20,
      response_time: 15,
      dispute_history: 10,
    },
    thresholds: {
      high: 80,
      medium: 60,
      low: 40,
    },
    auto_adjustments: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTrustScoreConfiguration();
      if (response.success) {
        setConfig(response.data.config || response.data || config);
      }
    } catch (error: any) {
      toast.error('Failed to load trust score configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateTrustScoreConfiguration(config);
      toast.success('Trust score configuration saved');
    } catch (error: any) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = Object.values(config.weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trust Score Weights</CardTitle>
          <p className="text-sm text-gray-500">
            Total: {totalWeight}% {totalWeight !== 100 && '(Must equal 100%)'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Verification Status (%)</Label>
            <Input
              type="number"
              value={config.weights.verification_status}
              onChange={(e) =>
                setConfig({
                  ...config,
                  weights: {
                    ...config.weights,
                    verification_status: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Reviews/Ratings (%)</Label>
            <Input
              type="number"
              value={config.weights.reviews_ratings}
              onChange={(e) =>
                setConfig({
                  ...config,
                  weights: {
                    ...config.weights,
                    reviews_ratings: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Project Completion Rate (%)</Label>
            <Input
              type="number"
              value={config.weights.project_completion_rate}
              onChange={(e) =>
                setConfig({
                  ...config,
                  weights: {
                    ...config.weights,
                    project_completion_rate: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Response Time (%)</Label>
            <Input
              type="number"
              value={config.weights.response_time}
              onChange={(e) =>
                setConfig({
                  ...config,
                  weights: {
                    ...config.weights,
                    response_time: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Dispute History (%)</Label>
            <Input
              type="number"
              value={config.weights.dispute_history}
              onChange={(e) =>
                setConfig({
                  ...config,
                  weights: {
                    ...config.weights,
                    dispute_history: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Threshold Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>High Trust Score (≥)</Label>
            <Input
              type="number"
              value={config.thresholds.high}
              onChange={(e) =>
                setConfig({
                  ...config,
                  thresholds: {
                    ...config.thresholds,
                    high: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Medium Trust Score (≥)</Label>
            <Input
              type="number"
              value={config.thresholds.medium}
              onChange={(e) =>
                setConfig({
                  ...config,
                  thresholds: {
                    ...config.thresholds,
                    medium: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Low Trust Score (≥)</Label>
            <Input
              type="number"
              value={config.thresholds.low}
              onChange={(e) =>
                setConfig({
                  ...config,
                  thresholds: {
                    ...config.thresholds,
                    low: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Automatic Adjustments</Label>
            <Switch
              checked={config.auto_adjustments}
              onCheckedChange={(checked) =>
                setConfig({ ...config, auto_adjustments: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || loading || totalWeight !== 100}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}


