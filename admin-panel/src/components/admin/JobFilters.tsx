'use client';

import { useState } from 'react';
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

import { Badge } from '../ui/badge';
import { X, Filter } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface JobFilters {
  status?: string;
  trade_type?: string;
  date_from?: Date;
  date_to?: Date;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  posted_by?: string;
}

interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
];

export function JobFilters({ filters, onFiltersChange, onReset }: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<JobFilters>(filters);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== null
  ).length;

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: JobFilters = {};
    setLocalFilters(emptyFilters);
    onReset();
  };

  const removeFilter = (key: keyof JobFilters) => {
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
      <PopoverContent className="w-[90vw] sm:w-[500px] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Advanced Filters</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset All
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value || undefined)}
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

          {/* Trade Type */}
          <div className="space-y-2">
            <Label>Trade Type</Label>
            <Input
              placeholder="Enter trade type"
              value={localFilters.trade_type || ''}
              onChange={(e) =>
                handleFilterChange('trade_type', e.target.value || undefined)
              }
            />
            {localFilters.trade_type && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('trade_type')}
              >
                {localFilters.trade_type}
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


