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
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { X, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface UserFilters {
  role?: string;
  status?: string;
  verification_status?: string;
  date_from?: Date;
  date_to?: Date;
  trust_score_min?: number;
  trust_score_max?: number;
  location?: string;
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

          {/* Registration Date Range */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Registration Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !localFilters.date_from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.date_from
                      ? format(localFilters.date_from, 'PPP')
                      : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.date_from}
                    onSelect={(date) => handleFilterChange('date_from', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !localFilters.date_to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.date_to
                      ? format(localFilters.date_to, 'PPP')
                      : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.date_to}
                    onSelect={(date) => handleFilterChange('date_to', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(localFilters.date_from || localFilters.date_to) && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  removeFilter('date_from');
                  removeFilter('date_to');
                }}
              >
                Date Range
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Trust Score Range */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Trust Score Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                min="0"
                max="100"
                value={localFilters.trust_score_min || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'trust_score_min',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
              <Input
                type="number"
                placeholder="Max"
                min="0"
                max="100"
                value={localFilters.trust_score_max || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'trust_score_max',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
            {(localFilters.trust_score_min || localFilters.trust_score_max) && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  removeFilter('trust_score_min');
                  removeFilter('trust_score_max');
                }}
              >
                Trust Score
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Location/State</Label>
            <Input
              placeholder="Enter location or state"
              value={localFilters.location || ''}
              onChange={(e) =>
                handleFilterChange('location', e.target.value || undefined)
              }
            />
            {localFilters.location && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('location')}
              >
                {localFilters.location}
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


