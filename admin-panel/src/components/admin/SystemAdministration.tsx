'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SystemConfiguration from './system/SystemConfiguration';
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <SystemConfiguration />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}


