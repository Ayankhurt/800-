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

export interface BidFilters {
  status?: string;
  trade_type?: string;
  budget_min?: number;
  budget_max?: number;
  deadline_from?: Date;
  deadline_to?: Date;
  created_by?: string;
}

interface BidFiltersProps {
  filters: BidFilters;
  onFiltersChange: (filters: BidFilters) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'awarded', label: 'Awarded' },
];

export function BidFilters({ filters, onFiltersChange, onReset }: BidFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<BidFilters>(filters);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && v !== null
  ).length;

  const handleFilterChange = (key: keyof BidFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: BidFilters = {};
    setLocalFilters(emptyFilters);
    onReset();
  };

  const removeFilter = (key: keyof BidFilters) => {
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

          {/* Deadline Range */}
          <div className="space-y-2">
            <Label>Deadline Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !localFilters.deadline_from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.deadline_from
                      ? format(localFilters.deadline_from, 'PPP')
                      : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.deadline_from}
                    onSelect={(date) => handleFilterChange('deadline_from', date)}
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
                      !localFilters.deadline_to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.deadline_to
                      ? format(localFilters.deadline_to, 'PPP')
                      : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.deadline_to}
                    onSelect={(date) => handleFilterChange('deadline_to', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(localFilters.deadline_from || localFilters.deadline_to) && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  removeFilter('deadline_from');
                  removeFilter('deadline_to');
                }}
              >
                Deadline Range
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

          {/* Created By */}
          <div className="space-y-2">
            <Label>Created By (User ID or Email)</Label>
            <Input
              placeholder="Enter user ID or email"
              value={localFilters.created_by || ''}
              onChange={(e) =>
                handleFilterChange('created_by', e.target.value || undefined)
              }
            />
            {localFilters.created_by && (
              <Badge
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeFilter('created_by')}
              >
                {localFilters.created_by}
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


