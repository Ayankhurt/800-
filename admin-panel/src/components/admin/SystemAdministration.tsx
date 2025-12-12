'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SystemConfiguration from './system/SystemConfiguration';
import LegalComplianceSettings from './system/LegalComplianceSettings';
import VerificationSettings from './system/VerificationSettings';
import TrustScoreConfiguration from './system/TrustScoreConfiguration';
import EmailNotificationSettings from './system/EmailNotificationSettings';
import DatabaseManagement from './system/DatabaseManagement';
import SecuritySettings from './system/SecuritySettings';

export default function SystemAdministration() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">System Administration</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Configure platform settings, security, and system management
        </p>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="legal">Legal & Compliance</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="trust-score">Trust Score</TabsTrigger>
          <TabsTrigger value="email">Email & Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <SystemConfiguration />
        </TabsContent>

        <TabsContent value="legal">
          <LegalComplianceSettings />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationSettings />
        </TabsContent>

        <TabsContent value="trust-score">
          <TrustScoreConfiguration />
        </TabsContent>

        <TabsContent value="email">
          <EmailNotificationSettings />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseManagement />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}


