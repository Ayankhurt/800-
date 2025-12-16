'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/src/lib/api/adminService';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { DollarSign, Calendar, User } from 'lucide-react';

const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'accepted':
            return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
        case 'rejected':
            return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
        default:
            return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
};

interface BidsTabProps {
    projectId: string;
}

export function BidsTab({ projectId }: BidsTabProps) {
    const { data: bidsResponse, isLoading } = useQuery({
        queryKey: ['project-bids', projectId],
        queryFn: async () => {
            // Fetch all bids and filter by project_id
            const response = await adminService.getAllBids({ limit: 1000 });
            return response;
        },
        enabled: !!projectId
    });

    const allBids = bidsResponse?.data?.bids || bidsResponse?.data || [];
    const projectBids = allBids.filter((bid: any) => bid.project_id === projectId);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (projectBids.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                    No bids submitted for this project yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {projectBids.map((bid: any) => (
                        <div key={bid.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">
                                                {bid.contractor?.full_name ||
                                                    `${bid.contractor?.first_name || ''} ${bid.contractor?.last_name || ''}`.trim() ||
                                                    'Contractor'}
                                            </h4>
                                            <p className="text-sm text-gray-500">{bid.contractor?.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {bid.proposal && (
                                        <p className="text-sm text-gray-700 mt-2 mb-3">{bid.proposal}</p>
                                    )}

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                                            <DollarSign className="h-4 w-4" />
                                            {formatCurrency(bid.amount || bid.bid_amount)}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(bid.created_at)}
                                        </div>
                                        {bid.estimated_duration && (
                                            <div className="text-gray-500">
                                                Duration: {bid.estimated_duration} days
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {getStatusBadge(bid.status)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
