'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

interface OtpVerificationProps {
  tempToken: string;
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function OtpVerification({ tempToken, email, onSuccess, onBack }: OtpVerificationProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      await verifyOtp(tempToken, otp);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-center">
              Enter the 6-digit code sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  disabled={loading}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 text-center">
                  Code expires in 10 minutes
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              {/* Back Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onBack}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

