'use client';

import { useState } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useAuth } from '@/src/contexts/AuthContext';
import { authService } from '@/src/lib/api/authService';
import { toast } from 'sonner';

export default function MfaToggle() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);

  const handleToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await authService.toggleMfa(enabled);
      if (response.success) {
        setMfaEnabled(enabled);
        updateUser({ mfa_enabled: enabled });
        toast.success(`MFA ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(response.message || 'Failed to update MFA');
        setMfaEnabled(!enabled); // Revert
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update MFA');
      setMfaEnabled(!enabled); // Revert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-0.5">
        <Label htmlFor="mfa-toggle" className="text-base font-medium">
          Two-Factor Authentication (MFA)
        </Label>
        <p className="text-sm text-gray-500">
          Add an extra layer of security to your account
        </p>
      </div>
      <Switch
        id="mfa-toggle"
        checked={mfaEnabled}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
}

