'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { authService } from '@/src/lib/api/authService';
import { Session } from '@/src/lib/api/authService';
import { toast } from 'sonner';
import { Trash2, Monitor, Smartphone, Tablet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

function parseDevice(userAgent: string): { device: string; icon: React.ReactNode } {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) {
    return { device: 'Mobile Device', icon: <Smartphone className="h-4 w-4" /> };
  }
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return { device: 'Tablet', icon: <Tablet className="h-4 w-4" /> };
  }
  return { device: 'Desktop', icon: <Monitor className="h-4 w-4" /> };
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const response = await authService.getSessions();
      if (response.success) {
        setSessions(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await authService.deleteSession(sessionId);
      if (response.success) {
        toast.success('Session removed');
        loadSessions();
      } else {
        toast.error(response.message || 'Failed to remove session');
      }
    } catch (error: any) {
      toast.error('Failed to remove session');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading sessions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No active sessions</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const { device, icon } = parseDevice(session.user_agent || '');
                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {icon}
                        <span>{device}</span>
                      </div>
                    </TableCell>
                    <TableCell>{session.ip_address}</TableCell>
                    <TableCell>
                      {new Date(session.login_time || session.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(session.expires_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

