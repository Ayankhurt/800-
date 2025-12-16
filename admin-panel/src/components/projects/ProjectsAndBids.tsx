'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { projectsService } from '@/src/lib/api/projectsService';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Format currency
const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

// Format date
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
};

// Helper to get client name
const getClientName = (project: any) => {
  if (project.client?.full_name) return project.client.full_name;
  if (project.owner?.full_name) return project.owner.full_name;
  if (project.owner?.first_name || project.owner?.last_name) {
    return `${project.owner.first_name || ''} ${project.owner.last_name || ''}`.trim();
  }
  if (project.user?.full_name) return project.user.full_name;
  return 'N/A';
};

export function ProjectsAndBids() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Fetch projects (Using Admin Service)
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: async () => {
      console.log('🔵 Fetching projects with status:', statusFilter);
      try {
        const result = await adminService.getAllProjects({
          status: statusFilter,
          limit: 100
        });
        console.log('🔵 Projects API Response:', result);
        return result;
      } catch (error: any) {
        console.error('🔴 Projects API Error:', error);
        console.error('🔴 Error Response:', error.response?.data);
        console.error('🔴 Error Status:', error.response?.status);
        throw error;
      }
    },
  });

  // Fetch bids for all projects (Using Admin Service)
  const { data: bidsData } = useQuery({
    queryKey: ['bids-all'],
    queryFn: () => adminService.getAllBids({ limit: 1000 }),
    enabled: !!projectsData,
  });

  // Approve milestone mutation
  const approveMilestoneMutation = useMutation({
    mutationFn: (milestoneId: string) => projectsService.approveMilestone(milestoneId),
    onSuccess: () => {
      toast.success('Milestone approved successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve milestone');
    },
  });

  // Submit milestone mutation
  const submitMilestoneMutation = useMutation({
    mutationFn: (milestoneId: string) => projectsService.submitMilestone(milestoneId),
    onSuccess: () => {
      toast.success('Milestone submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to submit milestone');
    },
  });

  // Handle different API response structures (AdminService vs ProjectsService)
  const rawProjects = projectsData?.data;
  const projects = Array.isArray(rawProjects) ? rawProjects : (rawProjects?.projects || []);

  const rawBids = bidsData?.data;
  const bids = Array.isArray(rawBids) ? rawBids : (rawBids?.bids || []);

  // Filter projects by search query
  const filteredProjects = projects.filter((project: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = project.title || project.name || '';
    const clientName = project.client?.full_name || project.owner?.full_name || project.user?.full_name || '';
    const clientEmail = project.client?.email || project.owner?.email || project.user?.email || '';

    return (
      title.toLowerCase().includes(query) ||
      clientName.toLowerCase().includes(query) ||
      clientEmail.toLowerCase().includes(query) ||
      formatCurrency(project.budget).toLowerCase().includes(query)
    );
  });

  // Get bid count for a project (assuming project has job_id or we match by name)
  const getBidCount = (projectId: string) => {
    // This is a simplified version - you may need to adjust based on your data structure
    return bids.filter((bid: any) => bid.job_id === projectId || bid.project_id === projectId).length;
  };

  // Get milestones for a project
  const [projectMilestones, setProjectMilestones] = useState<Record<string, any[]>>({});

  const fetchMilestones = async (projectId: string) => {
    if (projectMilestones[projectId]) return;
    try {
      const response = await projectsService.getProjectMilestones(projectId);
      if (response.success) {
        setProjectMilestones(prev => ({ ...prev, [projectId]: response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  };

  // Calculate progress from milestones
  const getProjectProgress = (projectId: string) => {
    const milestones = projectMilestones[projectId] || [];
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m: any) => m.status === 'completed' || m.status === 'approved').length;
    return Math.round((completed / milestones.length) * 100);
  };

  // Filter projects by tab
  const getFilteredProjectsByTab = () => {
    switch (activeTab) {
      case 'active':
        return filteredProjects.filter((p: any) => p.status === 'active' || p.status === 'in_progress');
      case 'bidding':
        return filteredProjects.filter((p: any) => p.status === 'bidding' || p.status === 'open');
      case 'completed':
        return filteredProjects.filter((p: any) => p.status === 'completed' || p.status === 'closed');
      default:
        return filteredProjects;
    }
  };

  const activeProjects = getFilteredProjectsByTab();
  const biddingProjects = filteredProjects.filter((p: any) => p.status === 'bidding' || p.status === 'open');
  const completedProjects = filteredProjects.filter((p: any) => p.status === 'completed' || p.status === 'closed');

  // Calculate stats
  const stats = {
    total: projects.length,
    active: projects.filter((p: any) => p.status === 'active' || p.status === 'in_progress').length,
    bidding: biddingProjects.length,
    completed: completedProjects.length,
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'bidding':
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700">Bidding</Badge>;
      case 'completed':
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const ProjectTable = ({ data }: { data: any[] }) => {
    if (projectsLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bids</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No projects found
              </TableCell>
            </TableRow>
          ) : (
            data.map((project: any) => {
              const bidCount = getBidCount(project.id);
              const progress = getProjectProgress(project.id);

              return (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.title || project.name || 'Unnamed Project'}</div>
                      <div className="text-gray-500 text-sm">
                        {project.description ? `${project.description.substring(0, 50)}...` : 'No description'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getClientName(project)}
                  </TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{bidCount} bids</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(project.budget)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-20" />
                      <span className="text-gray-600 text-sm">{progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {formatDate(project.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          fetchMilestones(project.id);
                          router.push(`/dashboard/projects/${project.id}?tab=bids`);
                        }}>
                          View Bids
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          fetchMilestones(project.id);
                          router.push(`/dashboard/projects/${project.id}?tab=milestones`);
                        }}>
                          View Milestones
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Projects & Bids</h2>
          <p className="text-gray-600">Manage all projects, bids, and milestones</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Projects</p>
                <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Active Projects</p>
                <p className="mt-1 text-2xl font-semibold">{stats.active}</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">In Bidding</p>
                <p className="mt-1 text-2xl font-semibold">{stats.bidding}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Completed</p>
                <p className="mt-1 text-2xl font-semibold">{stats.completed}</p>
              </div>
              <div className="bg-gray-50 text-gray-600 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects by name, client, or budget..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setStatusFilter(undefined)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="bidding">Bidding Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="completed">Completed Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects ({activeProjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectTable data={activeProjects} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bidding">
          <Card>
            <CardHeader>
              <CardTitle>Projects in Bidding ({biddingProjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectTable data={biddingProjects} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : activeProjects.length > 0 ? (
                <div className="space-y-4">
                  {activeProjects.slice(0, 10).map((project: any) => {
                    // Fetch milestones on mount
                    if (projectMilestones[project.id] === undefined) {
                      fetchMilestones(project.id);
                    }
                    const milestones = projectMilestones[project.id] || [];
                    const pendingMilestones = milestones.filter((m: any) => m.status === 'pending' || m.status === 'submitted');

                    if (pendingMilestones.length === 0 && milestones.length === 0) {
                      return (
                        <div key={project.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{project.title || project.name || 'Unnamed Project'}</h3>
                              <p className="text-gray-600 mt-1">
                                Client: {getClientName(project)}
                              </p>
                              {projectMilestones[project.id] === undefined ? (
                                <p className="text-gray-500 text-sm mt-2">Loading milestones...</p>
                              ) : (
                                <p className="text-gray-500 text-sm mt-2">No milestones set</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (pendingMilestones.length === 0) return null;

                    return (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{project.title || project.name || 'Unnamed Project'}</h3>
                            <p className="text-gray-600 mt-1">
                              Client: {getClientName(project)}
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                              <div>
                                <span className="text-gray-600">Pending: </span>
                                <span>{pendingMilestones.length}</span>
                              </div>
                              {milestones.length > 0 && (
                                <Progress
                                  value={(milestones.filter((m: any) => m.status === 'completed' || m.status === 'approved').length / milestones.length) * 100}
                                  className="w-40"
                                />
                              )}
                            </div>
                          </div>
                          {pendingMilestones.length > 0 && (
                            <Button
                              variant="outline"
                              className="text-blue-600"
                              onClick={() => {
                                const nextMilestone = pendingMilestones[0];
                                if (nextMilestone) {
                                  approveMilestoneMutation.mutate(nextMilestone.id);
                                }
                              }}
                              disabled={approveMilestoneMutation.isPending}
                            >
                              {approveMilestoneMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Approve Next
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active projects with pending milestones
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Projects ({completedProjects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectTable data={completedProjects} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}
