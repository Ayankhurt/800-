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
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { X, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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

          {/* Date Posted Range */}
          <div className="space-y-2">
            <Label>Date Posted Range</Label>
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

          {/* Budget Range */}
          <div className="space-y-2">
            <Label>Budget Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                min="0"
                value={localFilters.budget_min || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'budget_min',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
              <Input
                type="number"
                placeholder="Max"
                min="0"
                value={localFilters.budget_max || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'budget_max',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
            {(localFilters.budget_min || localFilters.budget_max) && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  removeFilter('budget_min');
                  removeFilter('budget_max');
                }}
              >
                Budget Range
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              placeholder="Enter location"
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

          {/* Posted By */}
          <div className="space-y-2">
            <Label>Posted By (User ID or Email)</Label>
            <Input
              placeholder="Enter user ID or email"
              value={localFilters.posted_by || ''}
              onChange={(e) =>
                handleFilterChange('posted_by', e.target.value || undefined)
              }
            />
            {localFilters.posted_by && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('posted_by')}
              >
                {localFilters.posted_by}
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


