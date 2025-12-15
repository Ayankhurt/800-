'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UserFilters {
  role?: string;
  status?: string;
  verification_status?: string;
  search?: string;
}

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onReset: () => void;
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'PM', label: 'Project Manager' },
  { value: 'GC', label: 'General Contractor' },
  { value: 'SUB', label: 'Subcontractor' },
  { value: 'TS', label: 'Trade Specialist' },
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER', label: 'Super Admin' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'locked', label: 'Locked' },
  { value: 'deleted', label: 'Deleted' },
];

const VERIFICATION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'unverified', label: 'Unverified' },
];

export function UserFilters({ filters, onFiltersChange, onReset }: UserFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== null
  ).length;

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: UserFilters = {};
    setLocalFilters(emptyFilters);
    onReset();
  };

  const removeFilter = (key: keyof UserFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-blue-600 text-white">{activeFilterCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] max-h-[500px] overflow-y-auto p-3" align="end" side="bottom">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset All
              </Button>
            )}
          </div>

          {/* Role Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Role</Label>
            <Select
              value={localFilters.role || 'all'}
              onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.role && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('role')}
              >
                {ROLE_OPTIONS.find((o) => o.value === localFilters.role)?.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Activity Status</Label>
            <Select
              value={localFilters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.status && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('status')}
              >
                {STATUS_OPTIONS.find((o) => o.value === localFilters.status)?.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Verification Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Verification Status</Label>
            <Select
              value={localFilters.verification_status || 'all'}
              onValueChange={(value) =>
                handleFilterChange('verification_status', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select verification status" />
              </SelectTrigger>
              <SelectContent>
                {VERIFICATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.verification_status && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('verification_status')}
              >
                {
                  VERIFICATION_OPTIONS.find(
                    (o) => o.value === localFilters.verification_status
                  )?.label
                }
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1"
              variant="outline"
            >
              Close
            </Button>
            {activeFilterCount > 0 && (
              <Button onClick={handleReset} className="flex-1" variant="outline">
                Reset
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


