'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/src/lib/api/projectsService';
import { adminService } from '@/src/lib/api/adminService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { ArrowLeft, Calendar, MapPin, DollarSign, User, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { BidsTab } from './BidsTab';

const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
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

interface ProjectDetailsProps {
    id: string;
}

export function ProjectDetails({ id }: ProjectDetailsProps) {
    const router = useRouter();

    const { data: projectResponse, isLoading, error } = useQuery({
        queryKey: ['project', id],
        queryFn: () => adminService.getProjectById(id),
        retry: 1
    });

    const { data: milestonesResponse } = useQuery({
        queryKey: ['project-milestones', id],
        queryFn: () => projectsService.getProjectMilestones(id),
        enabled: !!id
    });

    const project = projectResponse?.data;
    const milestones = milestonesResponse?.data || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <h3 className="text-xl font-semibold text-red-600">Error loading project</h3>
                <p className="text-gray-500 mt-2">{(error as any)?.message || 'Project not found'}</p>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    // Determine client/owner name safely
    const clientName = project.client?.full_name ||
        (project as any).owner?.full_name ||
        ((project as any).owner?.first_name ? `${(project as any).owner.first_name} ${(project as any).owner.last_name}` : 'N/A');

    const contractorName = (project as any).contractor?.full_name ||
        ((project as any).contractor?.first_name ? `${(project as any).contractor.first_name} ${(project as any).contractor.last_name}` : 'Unassigned');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Button variant="ghost" className="pl-0 mb-2 hover:bg-transparent" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{project.name || (project as any).title}</h1>
                        {getStatusBadge(project.status)}
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {(project as any).location || 'Remote'}</span>
                        <span>•</span>
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> Posted {formatDate(project.created_at)}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Actions can go here */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{project.description || 'No description provided.'}</p>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="milestones">
                        <TabsList>
                            <TabsTrigger value="milestones">Milestones</TabsTrigger>
                            <TabsTrigger value="bids">Bids</TabsTrigger>
                        </TabsList>
                        <TabsContent value="milestones">
                            <Card>
                                <CardContent className="pt-6">
                                    {milestones.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500">No milestones set for this project.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {milestones.map((milestone: any) => (
                                                <div key={milestone.id} className="border rounded-lg p-4 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium">{milestone.title}</h4>
                                                        <p className="text-sm text-gray-500">{milestone.description}</p>
                                                        <div className="mt-2 text-sm flex gap-4">
                                                            <span className="font-medium text-green-600">{formatCurrency(milestone.payment_amount || milestone.amount)}</span>
                                                            <span className="text-gray-500">Due: {formatDate(milestone.due_date)}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                                                            {milestone.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="bids">
                            <BidsTab projectId={id} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Budget</p>
                                <p className="text-2xl font-bold flex items-center text-green-700 mt-1">
                                    <DollarSign className="h-5 w-5 mr-1" />
                                    {formatCurrency(project.budget || (project as any).total_amount)}
                                </p>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium text-gray-500">Category</p>
                                <div className="flex items-center mt-1">
                                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{(project as any).category || 'General'}</span>
                                </div>
                            </div>
                            {/* Add more fields like Dates */}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>People</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Client / Owner</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {clientName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{clientName}</p>
                                        <p className="text-xs text-gray-500">{(project.client?.email || (project as any).owner?.email)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium text-gray-500">Contractor</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                        {contractorName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{contractorName}</p>
                                        <p className="text-xs text-gray-500">{(project as any).contractor?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
