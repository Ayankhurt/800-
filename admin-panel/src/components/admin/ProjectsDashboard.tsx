'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, Project, type ProjectsDashboard } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Search,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboard, setDashboard] = useState<ProjectsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  status: 'all',
    owner_id: '',
      contractor_id: '',
        trade_type: '',
  });

useEffect(() => {
  loadDashboard();
  loadProjects();
}, [filters]);

const loadDashboard = async () => {
  try {
    const response = await adminService.getProjectsDashboard();
    if (response.success) {
      setDashboard(response.data);
    }
  } catch (error: any) {
    // Handle error silently
  }
};

const loadProjects = async () => {
  try {
    setLoading(true);
    const params: any = {};
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.owner_id) params.owner_id = filters.owner_id;
    if (filters.contractor_id) params.contractor_id = filters.contractor_id;
    if (filters.trade_type) params.trade_type = filters.trade_type;
    if (filters.budget_min) params.budget_min = Number(filters.budget_min);
    if (filters.budget_max) params.budget_max = Number(filters.budget_max);
    if (filters.start_date_from) params.start_date_from = filters.start_date_from.toISOString();
    if (filters.start_date_to) params.start_date_to = filters.start_date_to.toISOString();
    if (filters.completion_percentage_min) params.completion_percentage_min = Number(filters.completion_percentage_min);
    if (filters.completion_percentage_max) params.completion_percentage_max = Number(filters.completion_percentage_max);

    const response = await adminService.getAllProjects(params);
    if (response.success) {
      setProjects(response.data.projects || response.data || []);
    }
  } catch (error: any) {
    toast.error('Failed to load projects');
  } finally {
    setLoading(false);
  }
};

const filteredProjects = useMemo(() => {
  let filtered = projects;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.owner?.full_name?.toLowerCase().includes(query) ||
        project.contractor?.full_name?.toLowerCase().includes(query)
    );
  }
  return filtered;
}, [projects, searchQuery]);

const handleExport = async () => {
  try {
    // Export logic would go here
    toast.success('Projects exported successfully');
  } catch (error: any) {
    toast.error('Failed to export projects');
  }
};

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; className: string }> = {
    setup: { label: 'Setup', className: 'bg-blue-500' },
    active: { label: 'Active', className: 'bg-green-500' },
    completed: { label: 'Completed', className: 'bg-gray-500' },
    disputed: { label: 'Disputed', className: 'bg-red-500' },
    cancelled: { label: 'Cancelled', className: 'bg-orange-500' },
  };


  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage all projects and construction activities
          </p>
        </div>
        {/* Export removed - Core features only */}
      </div>



      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects by title, description, owner, or contractor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="setup">Setup</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Owner ID"
            value={filters.owner_id}
            onChange={(e) => setFilters({ ...filters, owner_id: e.target.value })}
          />
          <Input
            placeholder="Contractor ID"
            value={filters.contractor_id}
            onChange={(e) => setFilters({ ...filters, contractor_id: e.target.value })}
          />
          <Input
            placeholder="Trade Type"
            value={filters.trade_type}
            onChange={(e) => setFilters({ ...filters, trade_type: e.target.value })}
          />
        </div>
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="hidden md:table-cell">Contractor</TableHead>
                <TableHead className="hidden lg:table-cell">Budget</TableHead>
                <TableHead className="hidden lg:table-cell">Completion</TableHead>
                <TableHead className="hidden xl:table-cell">Start Date</TableHead>
                <TableHead className="hidden xl:table-cell">Disputes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No projects found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {project.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {project.owner?.full_name || project.owner_id}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {project.contractor?.full_name || project.contractor_id}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      ${(project.total_amount || project.budget || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${project.completion_percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm">{project.completion_percentage || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {format(new Date(project.start_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {project.dispute_count > 0 ? (
                        <Badge className="bg-red-500">{project.dispute_count}</Badge>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


